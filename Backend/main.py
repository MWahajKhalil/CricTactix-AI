
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes.health import router as health_router
from app.api.routes.matches import router as matches_router

app = FastAPI(
    title="AI Cricket Tactical Analyst API",
    description="Backend API for cricket tactical analysis, RAG, and player statistics.",
    version="0.1.0",
)

# Configure CORS for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health_router, prefix="/api")
app.include_router(matches_router, prefix="/api")


@app.get("/")
def root():
    return {
        "message": "AI Cricket Tactical Analyst API is running"
    }

