from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from pydantic import BaseModel, ConfigDict
from pypdf.errors import PdfReadError

from src.resume.parser import extract_pdf_text
from src.resume.skill_extractor import extract_skills
from src.resume.skill_gap import compare_skill_sets


MAX_PDF_SIZE_BYTES = 5 * 1024 * 1024


router = APIRouter(
    prefix="/resume",
    tags=["resume"],
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


@router.post(
    "/extract",
    response_model=ResumeExtractionResponse,
)
async def extract_resume_skills(
    file: UploadFile = File(...),
):
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=415,
            detail="Only PDF files are supported.",
        )

    pdf_bytes = await file.read()

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
