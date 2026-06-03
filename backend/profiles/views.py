from uuid import UUID
import os
import redis as redis_lib
from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException, status
from profiles.models import FreelancerProfile, SkillToProfile, ProfileLanguage
from profiles.schemas import ProfileUpdate, SkillAddRequest, LanguageAddRequest, SkillInProfile, LanguageInProfile
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
    return _build_profile_response(profile, db)


def get_top_freelancers(db: Session, category_slug: str | None = None) -> list[dict]:
    query = db.query(FreelancerProfile).filter(FreelancerProfile.rating > 0)
    if category_slug:
        from categories.models import Category
        from skills.models import Skill
        category = db.query(Category).filter(Category.slug == category_slug).first()
        if category:
            skill_ids = [s.id for s in db.query(Skill).filter(Skill.category_id == category.id).all()]
            profile_ids = [
                stp.profile_id for stp in
                db.query(SkillToProfile).filter(SkillToProfile.skill_id.in_(skill_ids)).all()
            ]
            query = query.filter(FreelancerProfile.id.in_(profile_ids))
    profiles = query.order_by(
        (FreelancerProfile.rating * func.ln(func.greatest(FreelancerProfile.total_jobs, 0) + 2)).desc()
    ).limit(20).all()
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
