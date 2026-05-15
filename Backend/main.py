from fastapi import FastAPI
from app.api.routes.health import router as health_router

app = FastAPI(
    title="AI Cricket Tactical Analyst API",
    description="Backend API for cricket tactical analysis, RAG, and player statistics.",
    version="0.1.0",
)

app.include_router(health_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "AI Cricket Tactical Analyst API is running"
    }
    