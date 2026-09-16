from fastapi import FastAPI

from src.api.placement_routes import router as placement_router


app = FastAPI(
    title="SIPS ML Service",
    version="1.0.0",
    description="Machine learning service for the Smart Intelligent Placement System.",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "SIPS ML Service",
    }


app.include_router(placement_router)
