from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, ConfigDict

from src.employability.index import calculate_employability_index


router = APIRouter(
    prefix="/employability",
    tags=["employability"],
)


class EmployabilityRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    component_scores: dict[str, float]
    weights: dict[str, float]


class EmployabilityResponse(BaseModel):
    employability_index: float
    component_contributions: dict[str, float]
    weights: dict[str, float]


@router.post(
    "/calculate",
    response_model=EmployabilityResponse,
)
def calculate_index(
    request: EmployabilityRequest,
):
    try:
        return calculate_employability_index(
            component_scores=request.component_scores,
            weights=request.weights,
        )
    except (TypeError, ValueError) as error:
        raise HTTPException(
            status_code=422,
            detail=str(error),
        ) from error
