from io import BytesIO

from fastapi import APIRouter, File, Form, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict
from pypdf.errors import PdfReadError

from src.resume.hybrid_matcher import (
    DEFAULT_SEMANTIC_WEIGHT,
    DEFAULT_SKILL_WEIGHT,
    calculate_hybrid_match,
)
from src.resume.parser import extract_pdf_text
from src.resume.semantic_matcher import (
    DEFAULT_MODEL_NAME,
    calculate_semantic_similarity,
)
from src.resume.skill_extractor import extract_skills
from src.resume.skill_gap import compare_skill_sets
from src.resume.skill_normalizer import normalize_skills


MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024


router = APIRouter(
    prefix="/resume",
    tags=["resume"],
)


def _validate_pdf_upload(
    file: UploadFile,
    pdf_bytes: bytes,
) -> None:
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are supported.",
        )

    if not pdf_bytes:
        raise HTTPException(
            status_code=400,
            detail="Uploaded PDF must not be empty.",
        )

    if len(pdf_bytes) > MAX_PDF_SIZE_BYTES:
        raise HTTPException(
            status_code=413,
            detail="PDF file must not exceed 5 MB.",
        )

    if b"%PDF-" not in pdf_bytes[:1024]:
        raise HTTPException(
            status_code=422,
            detail="Uploaded file is not a valid PDF.",
        )


class ResumeExtractionResponse(BaseModel):
    extracted_skills: list[str]


class ResumeMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_skills: list[str]
    required_skills: list[str]


class ResumeMatchResponse(BaseModel):
    matched_skills: list[str]
    missing_skills: list[str]
    coverage_score: float


class SemanticMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_skills: list[str]
    job_text: str


class SemanticMatchResponse(BaseModel):
    semantic_similarity: float
    model_name: str


@router.post(
    "/extract",
    response_model=ResumeExtractionResponse,
)
async def extract_resume_skills(
    file: UploadFile = File(...),
):
    pdf_bytes = await file.read()
    _validate_pdf_upload(file, pdf_bytes)

    try:
        resume_text = extract_pdf_text(
            BytesIO(pdf_bytes)
        )
    except (PdfReadError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return {
        "extracted_skills": extract_skills(
            resume_text
        )
    }


@router.post(
    "/match",
    response_model=ResumeMatchResponse,
)
def match_resume_skills(
    request: ResumeMatchRequest,
):
    return compare_skill_sets(
        request.student_skills,
        request.required_skills,
    )


@router.post(
    "/semantic-match",
    response_model=SemanticMatchResponse,
)
def semantic_match_resume(
    request: SemanticMatchRequest,
):
    normalized_skills = normalize_skills(
        request.student_skills
    )

    if not normalized_skills:
        raise HTTPException(
            status_code=422,
            detail="Student skills must not be empty.",
        )

    try:
        similarity = calculate_semantic_similarity(
            " ".join(normalized_skills),
            request.job_text,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return {
        "semantic_similarity": round(
            similarity,
            4,
        ),
        "model_name": DEFAULT_MODEL_NAME,
    }


class ResumeAnalysisResponse(BaseModel):
    extracted_skills: list[str]
    matched_skills: list[str]
    missing_skills: list[str]
    coverage_score: float


@router.post(
    "/analyze",
    response_model=ResumeAnalysisResponse,
)
async def analyze_resume(
    file: UploadFile = File(...),
    required_skills: list[str] = Form(...),
):
    pdf_bytes = await file.read()
    _validate_pdf_upload(file, pdf_bytes)

    try:
        resume_text = extract_pdf_text(
            BytesIO(pdf_bytes)
        )
        extracted_skills = extract_skills(
            resume_text
        )
        gap_analysis = compare_skill_sets(
            extracted_skills,
            required_skills,
        )
    except (PdfReadError, TypeError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error

    return {
        "extracted_skills": extracted_skills,
        **gap_analysis,
    }


class HybridMatchRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    student_skills: list[str]
    required_skills: list[str]
    resume_text: str
    job_text: str
    skill_weight: float = DEFAULT_SKILL_WEIGHT
    semantic_weight: float = DEFAULT_SEMANTIC_WEIGHT


class HybridMatchResponse(BaseModel):
    matched_skills: list[str]
    missing_skills: list[str]
    skill_coverage_score: float
    semantic_similarity: float
    semantic_score: float
    hybrid_match_score: float
    skill_weight: float
    semantic_weight: float


@router.post(
    "/hybrid-match",
    response_model=HybridMatchResponse,
)
def hybrid_match_resume(
    request: HybridMatchRequest,
):
    try:
        return calculate_hybrid_match(
            student_skills=request.student_skills,
            required_skills=request.required_skills,
            resume_text=request.resume_text,
            job_text=request.job_text,
            skill_weight=request.skill_weight,
            semantic_weight=request.semantic_weight,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
