"""
Main FastAPI application for Soccer Chemistry API.
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import logging
from contextlib import asynccontextmanager

from config import ALLOWED_ORIGINS, API_PREFIX, DATA_PATH
from services.data_loader import data_loader
from routes import chemistry, players, optimizer
from models.schemas import HealthResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifespan context manager for startup and shutdown events."""
    # Startup
    logger.info("Starting Soccer Chemistry API...")
    try:
        data_loader.load_data(DATA_PATH)
        logger.info("Data loaded successfully")
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down Soccer Chemistry API...")


# Create FastAPI app
app = FastAPI(
    title="Soccer Chemistry API",
    description="API for calculating player chemistry in soccer",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(chemistry.router, prefix=f"{API_PREFIX}/chemistry", tags=["chemistry"])
app.include_router(players.router, prefix=f"{API_PREFIX}/players", tags=["players"])
app.include_router(optimizer.router, prefix=f"{API_PREFIX}/optimize", tags=["optimizer"])


@app.get("/", response_model=HealthResponse)
async def root():
    """Root endpoint."""
    return {
        "status": "ok",
        "message": "Soccer Chemistry API is running"
    }


@app.get(f"{API_PREFIX}/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "message": "API is operational"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
