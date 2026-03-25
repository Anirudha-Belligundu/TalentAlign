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
    skills_score: float
    experience_score: float
    education_score: float
    overall_score: float
    matched_skills: List[str]
    missing_skills: List[str]
    extracted_skills: Optional[List[str]]
    experience_years: Optional[float]
    education_degree: Optional[str]
    education_field: Optional[str]
    education_university: Optional[str]
    work_history: Optional[List[dict]]
    projects_list: Optional[List[str]]
    explanation: Optional[str]
    recruiter_note: Optional[str]
    status: Optional[str]


class JDStructureOut(BaseModel):
    required_skills: Optional[List[str]]
    required_experience_years: Optional[float]
    required_education: Optional[str]
    nice_to_have_skills: Optional[List[str]]


class ResultsOut(BaseModel):
    project_id: int
    title: str
    total_candidates: int
    jd_structure: Optional[JDStructureOut]
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
        "jd_structure": {
            "required_skills": project.jd_required_skills or [],
            "required_experience_years": project.jd_required_experience_years or 0.0,
            "required_education": project.jd_required_education or "",
            "nice_to_have_skills": project.jd_nice_to_have_skills or [],
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
        jd_structure, results = analyzer.process_upload(jd_bytes, zip_bytes)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

    # Save JD structure to project
    project.jd_required_skills = jd_structure.get("required_skills", [])
    project.jd_required_experience_years = jd_structure.get("required_experience_years", 0.0)
    project.jd_required_education = jd_structure.get("required_education", "")
    project.jd_nice_to_have_skills = jd_structure.get("nice_to_have_skills", [])

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
            experience_years=r.get("experience_years", 0.0),
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
        "jd_structure": {
            "required_skills": project.jd_required_skills or [],
            "required_experience_years": project.jd_required_experience_years or 0.0,
            "required_education": project.jd_required_education or "",
            "nice_to_have_skills": project.jd_nice_to_have_skills or [],
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
        "experience_years": c.experience_years or 0.0,
        "education_degree": c.education_degree or "",
        "education_field": c.education_field or "",
        "education_university": c.education_university or "",
        "work_history": c.work_history or [],
        "projects_list": c.projects_list or [],
        "explanation": c.explanation,
        "recruiter_note": c.recruiter_note or "",
        "status": c.status or "new",
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


# ── Candidate Notes & Status ──────────────────────────────────────────────────

class CandidateUpdate(BaseModel):
    recruiter_note: Optional[str] = None
    status: Optional[str] = None


@router.patch("/{project_id}/candidates/{candidate_id}")
def update_candidate(
    project_id: int,
    candidate_id: int,
    body: CandidateUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(auth_utils.get_current_user),
):
    _get_project_or_404(project_id, current_user.id, db)
    candidate = db.query(models.Candidate).filter(
        models.Candidate.id == candidate_id,
        models.Candidate.project_id == project_id,
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if body.recruiter_note is not None:
        candidate.recruiter_note = body.recruiter_note
    if body.status is not None:
        valid = ["new", "shortlisted", "rejected", "on_hold"]
        if body.status not in valid:
            raise HTTPException(status_code=400, detail=f"Status must be one of {valid}")
        candidate.status = body.status

    db.commit()
    db.refresh(candidate)
    return _candidate_to_dict(candidate)