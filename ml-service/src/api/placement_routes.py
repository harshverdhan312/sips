from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict, Field

from src.placement.service import (
    PlacementModelUnavailableError,
    predict_placement,
)


router = APIRouter(
    prefix="/placement",
    tags=["placement"],
)


class PlacementRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    Age: int = Field(..., ge=19, le=30)
    Internships: int = Field(..., ge=0, le=3)
    CGPA: float = Field(..., ge=5, le=9)
    Hostel: int = Field(..., ge=0, le=1)
    HistoryOfBacklogs: int = Field(..., ge=0, le=1)
    Stream: str


class PlacementResponse(BaseModel):
    placement_probability: float
    decision_threshold: float
    predicted_class: int
    predicted_label: str
    model_version: str


@router.post(
    "/predict",
    response_model=PlacementResponse,
)
def placement_prediction(
    student: PlacementRequest,
):
    try:
        return predict_placement(
            student.model_dump()
        )
    except ValueError as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
    except PlacementModelUnavailableError as error:
        raise HTTPException(
            status_code=503,
            detail=str(error),
        ) from error
