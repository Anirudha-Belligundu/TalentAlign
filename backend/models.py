from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    projects = relationship("Project", back_populates="owner")


class Project(Base):
    __tablename__ = "projects"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    owner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    # Structured JD fields
    jd_required_skills     = Column(JSON, default=[])
    jd_preferred_skills    = Column(JSON, default=[])
    jd_required_experience = Column(String)   # e.g. "3-5 years"
    jd_required_education  = Column(String)   # e.g. "B.Tech in CS"
    jd_role_summary        = Column(Text)

    owner      = relationship("User", back_populates="projects")
    candidates = relationship("Candidate", back_populates="project", cascade="all, delete")


class Candidate(Base):
    __tablename__ = "candidates"

    id              = Column(Integer, primary_key=True, index=True)
    project_id      = Column(Integer, ForeignKey("projects.id"), nullable=False)
    resume_filename = Column(String)
    name            = Column(String)
    email           = Column(String)
    phone           = Column(String)

    # AI match scores
    skills_score    = Column(Float, default=0.0)
    experience_score= Column(Float, default=0.0)
    education_score = Column(Float, default=0.0)
    overall_score   = Column(Float, default=0.0)

    # Skill matching
    matched_skills  = Column(JSON, default=[])
    missing_skills  = Column(JSON, default=[])

    # Structured extracted fields
    extracted_skills      = Column(JSON, default=[])    # all skills from resume
    years_of_experience   = Column(Float, default=0.0)  # numeric years
    education_degree      = Column(String)              # e.g. "B.Tech"
    education_field       = Column(String)              # e.g. "Computer Science"
    education_university  = Column(String)              # e.g. "VTU"
    work_history          = Column(JSON, default=[])    # list of {company, role, duration}
    projects_list         = Column(JSON, default=[])    # list of project names

    # AI summary
    explanation     = Column(Text)

    project = relationship("Project", back_populates="candidates")
