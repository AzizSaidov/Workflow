import uuid
import enum
from sqlalchemy import Column, Integer, Numeric, ForeignKey, Boolean, String, Enum, DateTime
from sqlalchemy.dialects.postgresql import UUID, ARRAY, JSONB
from database import Base
from utils import get_dushanbe_time


class FreelancerProfile(Base):
    __tablename__ = "freelancer_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), unique=True, nullable=False)
    # legacy fields (kept for backward compatibility)
    skills = Column(ARRAY(String), nullable=False, default=list)
    portfolio = Column(JSONB, nullable=True, default=list)
    # core fields
    hourly_rate = Column(Numeric(10, 2), nullable=True)
    rating = Column(Numeric(3, 2), nullable=False, default=0)
    total_jobs = Column(Integer, nullable=False, default=0)
    # new fields (added in stage 2 — requires ALTER TABLE if DB already exists)
    title = Column(String, nullable=True)
    experience_years = Column(Integer, nullable=False, default=0)
    connects_balance = Column(Integer, nullable=False, default=10)
    is_verified = Column(Boolean, nullable=False, default=False)
    response_time = Column(String, nullable=True)
    github_url = Column(String, nullable=True)


class LanguageLevel(str, enum.Enum):
    basic = "basic"
    conversational = "conversational"
    fluent = "fluent"
    native = "native"


class SkillToProfile(Base):
    __tablename__ = "skills_to_profiles"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("freelancer_profiles.id"), nullable=False)
    skill_id = Column(UUID(as_uuid=True), ForeignKey("skills.id"), nullable=False)


class ProfileLanguage(Base):
    __tablename__ = "profile_languages"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("freelancer_profiles.id"), nullable=False)
    language_id = Column(UUID(as_uuid=True), ForeignKey("languages.id"), nullable=False)
    level = Column(Enum(LanguageLevel), nullable=False)


class ProfileCategory(Base):
    __tablename__ = "profile_categories"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("freelancer_profiles.id"), nullable=False)
    category_id = Column(UUID(as_uuid=True), ForeignKey("categories.id"), nullable=False)


class ProfileLike(Base):
    __tablename__ = "profile_likes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    liker_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    liked_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), default=get_dushanbe_time)
