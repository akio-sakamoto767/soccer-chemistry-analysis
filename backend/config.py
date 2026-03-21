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
    "http://localhost:5174",
    "http://127.0.0.1:5173",
    "http://127.0.0.1:3000",
    "https://frontend-alpha-weld-87.vercel.app",  # Your deployed frontend
    "https://*.vercel.app",
    "https://*.netlify.app",
    "*"  # Allow all origins for Vercel deployment
]

# Supabase Data Configuration
# Note: Update this URL from your Supabase project dashboard -> Storage -> dataset bucket
SUPABASE_DATASET_URL = os.getenv(
    "SUPABASE_DATASET_URL", 
    "https://iebtpftsqbaqfkrkavgn.supabase.co/storage/v1/object/public/dataset/dataset"
)

# Data loading settings
DATA_DOWNLOAD_TIMEOUT = int(os.getenv("DATA_DOWNLOAD_TIMEOUT", 300))  # 5 minutes
DATA_RETRY_ATTEMPTS = int(os.getenv("DATA_RETRY_ATTEMPTS", 3))
ENABLE_DATA_CACHE = os.getenv("ENABLE_DATA_CACHE", "true").lower() == "true"

# Fallback to local data path for development
_default_data_path = str(BASE_DIR.parent / "data")
DATA_PATH = os.getenv("DATA_PATH", _default_data_path)
# Resolve to absolute path if relative
if not os.path.isabs(DATA_PATH):
    DATA_PATH = str((BASE_DIR.parent / DATA_PATH).resolve())
USE_LOCAL_DATA = os.getenv("USE_LOCAL_DATA", "true").lower() == "true"  # Default to true

# Railway-specific: Skip startup data loading to avoid timeout
SKIP_STARTUP_DATA_LOAD = os.getenv("SKIP_STARTUP_DATA_LOAD", "true").lower() == "true"

# API settings
API_PREFIX = "/api"
API_VERSION = "v1"

# Cache settings
ENABLE_CACHE = True
CACHE_TTL = 3600  # 1 hour
