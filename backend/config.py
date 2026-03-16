"""
Configuration settings for the backend application.
"""
import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Base directory
BASE_DIR = Path(__file__).resolve().parent

# Server settings
HOST = os.getenv("HOST", "0.0.0.0")
PORT = int(os.getenv("PORT", 8000))

# CORS settings
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
ALLOWED_ORIGINS = [
    FRONTEND_URL,
    "http://localhost:3000",
    "http://localhost:5173",
]

# Data path
DATA_PATH = os.getenv("DATA_PATH", str(BASE_DIR.parent / "data"))

# API settings
API_PREFIX = "/api"
API_VERSION = "v1"

# Cache settings
ENABLE_CACHE = True
CACHE_TTL = 3600  # 1 hour
