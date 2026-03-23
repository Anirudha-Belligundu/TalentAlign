from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import List, Optional
from database import get_db
import models
import auth_utils
import analyzer

router = APIRouter()


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class ProjectCreate(BaseModel):
    title: str


class ProjectOut(BaseModel):
    id: int
    title: str
    created_at: str
    candidate_count: int

    class Config:
        from_attributes = True


class WorkHistoryItem(BaseModel):
    company: Optional[str]
    role: Optional[str]
    duration: Optional[str]


class CandidateOut(BaseModel):
    candidate_id: int
    name: Optional[str]
    email: Optional[str]
    phone: Optional[str]
    resume_filename: str

    # Scores
    skills_score: float
    experience_score: float
    education_score: float
    overall_score: float

    # Skill matching
    matched_skills: List[str]
    missing_skills: List[str]

    # Structured extracted fields
    extracted_skills: List[str]
    years_of_experience: float
    education_degree: Optional[str]
    education_field: Optional[str]
    education_university: Optional[str]
    work_history: List[dict]
    projects_list: List[str]

    explanation: Optional[str]


class JDFeaturesOut(BaseModel):
    role_summary: Optional[str]
    required_skills: List[str]
    preferred_skills: List[str]
    required_experience: Optional[str]
    required_education: Optional[str]


class ResultsOut(BaseModel):
    project_id: int
    title: str
    total_candidates: int
    jd_features: Optional[JDFeaturesOut]
    results: List[CandidateOut]


# ── Routes ────────────────────────────────────────────────────────────────────

@router.get("/", response_model=List[ProjectOut])
def list_projects(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    projects = (
        db.query(models.Project)
        .filter(models.Project.owner_id == current_user.id)
        .order_by(models.Project.created_at.desc())
        .all()
    )
    return [
        {
            "id": p.id,
            "title": p.title,
            "created_at": p.created_at.isoformat(),
            "candidate_count": len(p.candidates),
        }
        for p in projects
    ]


@router.post("/", response_model=ProjectOut)
def create_project(
    body: ProjectCreate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = models.Project(title=body.title, owner_id=current_user.id)
    db.add(project)
    db.commit()
    db.refresh(project)
    return {
        "id": project.id,
        "title": project.title,
        "created_at": project.created_at.isoformat(),
        "candidate_count": 0,
    }


@router.get("/{project_id}/results", response_model=ResultsOut)
def get_results(
    project_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)
    candidates = (
        db.query(models.Candidate)
        .filter(models.Candidate.project_id == project_id)
        .order_by(models.Candidate.overall_score.desc())
        .all()
    )
    return {
        "project_id": project.id,
        "title": project.title,
        "total_candidates": len(candidates),
        "jd_features": {
            "role_summary": project.jd_role_summary,
            "required_skills": project.jd_required_skills or [],
            "preferred_skills": project.jd_preferred_skills or [],
            "required_experience": project.jd_required_experience,
            "required_education": project.jd_required_education,
        },
        "results": [_candidate_to_dict(c) for c in candidates],
    }


@router.post("/{project_id}/upload", response_model=ResultsOut)
async def upload_and_analyze(
    project_id: int,
    jd_file: UploadFile = File(...),
    resumes_zip: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    project = _get_project_or_404(project_id, current_user.id, db)

    jd_bytes = await jd_file.read()
    zip_bytes = await resumes_zip.read()

    try:
        jd_features, results = analyzer.process_upload(jd_bytes, zip_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Save structured JD fields to project
    project.jd_required_skills     = jd_features.get("required_skills", [])
    project.jd_preferred_skills    = jd_features.get("preferred_skills", [])
    project.jd_required_experience = jd_features.get("required_experience", "")
    project.jd_required_education  = jd_features.get("required_education", "")
    project.jd_role_summary        = jd_features.get("role_summary", "")

    # Clear previous candidates
    db.query(models.Candidate).filter(models.Candidate.project_id == project_id).delete()

    saved = []
    for r in results:
        candidate = models.Candidate(
            project_id=project_id,
            resume_filename=r.get("resume_filename", ""),
            name=r.get("name"),
            email=r.get("email"),
            phone=r.get("phone"),
            skills_score=r.get("skills_score", 0.0),
            experience_score=r.get("experience_score", 0.0),
            education_score=r.get("education_score", 0.0),
            overall_score=r.get("overall_score", 0.0),
            matched_skills=r.get("matched_skills", []),
            missing_skills=r.get("missing_skills", []),
            extracted_skills=r.get("extracted_skills", []),
            years_of_experience=r.get("years_of_experience", 0.0),
            education_degree=r.get("education_degree"),
            education_field=r.get("education_field"),
            education_university=r.get("education_university"),
            work_history=r.get("work_history", []),
            projects_list=r.get("projects_list", []),
            explanation=r.get("explanation"),
        )
        db.add(candidate)
        db.flush()
        saved.append(candidate)

    db.commit()
    for c in saved:
        db.refresh(c)

    return {
        "project_id": project.id,
        "title": project.title,
        "total_candidates": len(saved),
        "jd_features": {
            "role_summary": project.jd_role_summary,
            "required_skills": project.jd_required_skills or [],
            "preferred_skills": project.jd_preferred_skills or [],
            "required_experience": project.jd_required_experience,
            "required_education": project.jd_required_education,
        },
        "results": [_candidate_to_dict(c) for c in saved],
    }


# ── Helpers ───────────────────────────────────────────────────────────────────

def _candidate_to_dict(c: models.Candidate) -> dict:
    return {
        "candidate_id": c.id,
        "name": c.name,
        "email": c.email,
        "phone": c.phone,
        "resume_filename": c.resume_filename,
        "skills_score": c.skills_score,
        "experience_score": c.experience_score,
        "education_score": c.education_score,
        "overall_score": c.overall_score,
        "matched_skills": c.matched_skills or [],
        "missing_skills": c.missing_skills or [],
        "extracted_skills": c.extracted_skills or [],
        "years_of_experience": c.years_of_experience or 0.0,
        "education_degree": c.education_degree,
        "education_field": c.education_field,
        "education_university": c.education_university,
        "work_history": c.work_history or [],
        "projects_list": c.projects_list or [],
        "explanation": c.explanation,
    }


def _get_project_or_404(project_id: int, user_id: int, db: Session) -> models.Project:
    project = (
        db.query(models.Project)
        .filter(models.Project.id == project_id, models.Project.owner_id == user_id)
        .first()
    )
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project
