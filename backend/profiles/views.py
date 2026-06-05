from uuid import UUID
import os
import redis as redis_lib
from sqlalchemy.orm import Session
from sqlalchemy import func
from categories.models import Category
from fastapi import HTTPException, status
from profiles.models import FreelancerProfile, SkillToProfile, ProfileLanguage, ProfileLike, ProfileCategory
from profiles.schemas import ProfileUpdate, SkillAddRequest, LanguageAddRequest, CategoryAddRequest, SkillInProfile, LanguageInProfile, CategoryInProfile
from users.models import User, UserRole
from skills.models import Skill
from languages.models import Language

_redis = redis_lib.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"), decode_responses=True)


def _build_profile_response(profile: FreelancerProfile, db: Session) -> dict:
    skill_links = (
        db.query(SkillToProfile, Skill)
        .join(Skill, Skill.id == SkillToProfile.skill_id)
        .filter(SkillToProfile.profile_id == profile.id)
        .all()
    )
    skills = [
        SkillInProfile(id=link.id, skill_id=skill.id, name=skill.name, slug=skill.slug)
        for link, skill in skill_links
    ]

    lang_links = (
        db.query(ProfileLanguage, Language)
        .join(Language, Language.id == ProfileLanguage.language_id)
        .filter(ProfileLanguage.profile_id == profile.id)
        .all()
    )
    languages = [
        LanguageInProfile(id=link.id, language_id=lang.id, name=lang.name, code=lang.code, level=link.level)
        for link, lang in lang_links
    ]

    cat_links = (
        db.query(ProfileCategory, Category)
        .join(Category, Category.id == ProfileCategory.category_id)
        .filter(ProfileCategory.profile_id == profile.id)
        .all()
    )
    categories = [
        CategoryInProfile(id=link.id, category_id=cat.id, name=cat.name, slug=cat.slug)
        for link, cat in cat_links
    ]

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "title": profile.title,
        "hourly_rate": profile.hourly_rate,
        "rating": profile.rating,
        "total_jobs": profile.total_jobs,
        "is_verified": profile.is_verified,
        "experience_years": profile.experience_years,
        "response_time": profile.response_time,
        "connects_balance": profile.connects_balance,
        "github_url": profile.github_url,
        "skills": skills,
        "languages": languages,
        "categories": categories,
        "is_online": bool(_redis.exists(f"online:{profile.user_id}")),
    }


def get_profile(user_id: UUID, db: Session) -> dict:
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    return _build_profile_response(profile, db)


def update_my_profile(data: ProfileUpdate, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers have profiles")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        profile = FreelancerProfile(user_id=current_user.id)
        db.add(profile)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    from achievements.views import check_and_grant
    check_and_grant(current_user, db)
    return _build_profile_response(profile, db)


def get_top_freelancers(db: Session, category_slug: str | None = None) -> list[dict]:
    query = db.query(FreelancerProfile)
    if category_slug:
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if not category:
            return []
        m2m_ids = [r.profile_id for r in db.query(ProfileCategory).filter(ProfileCategory.category_id == category.id).all()]
        query = query.filter(FreelancerProfile.id.in_(m2m_ids))
    profiles = query.order_by(
        (FreelancerProfile.rating * func.ln(func.greatest(FreelancerProfile.total_jobs, 0) + 2)).desc()
    ).limit(50).all()
    return [_build_profile_response(p, db) for p in profiles]


def get_all_freelancer_profiles(db: Session, category_slug: str | None = None) -> list[dict]:
    """Every freelancer profile (not just the top-ranked). Used by the /freelancers
    listing so that self-registered freelancers — who have rating 0 and would fall
    outside the ranked top-50 — still show their entered title, rate, skills, etc."""
    query = db.query(FreelancerProfile)
    if category_slug:
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if not category:
            return []
        m2m_ids = [r.profile_id for r in db.query(ProfileCategory).filter(ProfileCategory.category_id == category.id).all()]
        query = query.filter(FreelancerProfile.id.in_(m2m_ids))
    profiles = query.order_by(
        (FreelancerProfile.rating * func.ln(func.greatest(FreelancerProfile.total_jobs, 0) + 2)).desc()
    ).all()
    return [_build_profile_response(p, db) for p in profiles]


def add_skill(data: SkillAddRequest, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can add skills")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    skill = db.query(Skill).filter(Skill.id == data.skill_id).first()
    if not skill:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not found")
    exists = db.query(SkillToProfile).filter(
        SkillToProfile.profile_id == profile.id,
        SkillToProfile.skill_id == data.skill_id,
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Skill already added")
    link = SkillToProfile(profile_id=profile.id, skill_id=data.skill_id)
    db.add(link)
    db.commit()
    from achievements.views import check_and_grant
    check_and_grant(current_user, db)
    return _build_profile_response(profile, db)


def remove_skill(skill_id: UUID, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can remove skills")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    link = db.query(SkillToProfile).filter(
        SkillToProfile.profile_id == profile.id,
        SkillToProfile.skill_id == skill_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Skill not in profile")
    db.delete(link)
    db.commit()
    return _build_profile_response(profile, db)


def add_language(data: LanguageAddRequest, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can add languages")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    language = db.query(Language).filter(Language.id == data.language_id).first()
    if not language:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not found")
    exists = db.query(ProfileLanguage).filter(
        ProfileLanguage.profile_id == profile.id,
        ProfileLanguage.language_id == data.language_id,
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Language already added")
    link = ProfileLanguage(profile_id=profile.id, language_id=data.language_id, level=data.level)
    db.add(link)
    db.commit()
    return _build_profile_response(profile, db)


def remove_language(language_id: UUID, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can remove languages")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    link = db.query(ProfileLanguage).filter(
        ProfileLanguage.profile_id == profile.id,
        ProfileLanguage.language_id == language_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Language not in profile")
    db.delete(link)
    db.commit()
    return _build_profile_response(profile, db)


def add_category(data: CategoryAddRequest, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can add categories")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    cat = db.query(Category).filter(Category.id == data.category_id).first()
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found")
    exists = db.query(ProfileCategory).filter(
        ProfileCategory.profile_id == profile.id,
        ProfileCategory.category_id == data.category_id,
    ).first()
    if exists:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category already added")
    db.add(ProfileCategory(profile_id=profile.id, category_id=data.category_id))
    db.commit()
    return _build_profile_response(profile, db)


def remove_category(category_id: UUID, current_user: User, db: Session) -> dict:
    if current_user.role != UserRole.freelancer:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only freelancers can remove categories")
    profile = db.query(FreelancerProfile).filter(FreelancerProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Profile not found")
    link = db.query(ProfileCategory).filter(
        ProfileCategory.profile_id == profile.id,
        ProfileCategory.category_id == category_id,
    ).first()
    if not link:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not in profile")
    db.delete(link)
    db.commit()
    return _build_profile_response(profile, db)


def toggle_like(liked_user_id: UUID, current_user: User, db: Session) -> dict:
    if str(current_user.id) == str(liked_user_id):
        raise HTTPException(status_code=400, detail="Cannot like yourself")
    existing = db.query(ProfileLike).filter(
        ProfileLike.liker_id == current_user.id,
        ProfileLike.liked_user_id == liked_user_id,
    ).first()
    if existing:
        db.delete(existing)
        db.commit()
        liked = False
    else:
        db.add(ProfileLike(liker_id=current_user.id, liked_user_id=liked_user_id))
        db.commit()
        liked = True
    count = db.query(func.count(ProfileLike.id)).filter(ProfileLike.liked_user_id == liked_user_id).scalar()
    return {"liked": liked, "likes_count": count}


def get_likes(liked_user_id: UUID, current_user_id: UUID | None, db: Session) -> dict:
    count = db.query(func.count(ProfileLike.id)).filter(ProfileLike.liked_user_id == liked_user_id).scalar()
    liked = False
    if current_user_id:
        liked = db.query(ProfileLike).filter(
            ProfileLike.liker_id == current_user_id,
            ProfileLike.liked_user_id == liked_user_id,
        ).first() is not None
    return {"liked": liked, "likes_count": count}
