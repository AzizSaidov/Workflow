import uuid
from sqlalchemy import Column, String, Date, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from database import Base


class Certification(Base):
    __tablename__ = "certifications"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    profile_id = Column(UUID(as_uuid=True), ForeignKey("freelancer_profiles.id"), nullable=False)
    title = Column(String, nullable=False)
    issuer = Column(String, nullable=False)
    issue_date = Column(Date, nullable=False)
    credential_url = Column(String, nullable=True)
