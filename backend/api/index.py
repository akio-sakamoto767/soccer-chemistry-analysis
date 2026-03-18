"""
Vercel entry point for the Soccer Chemistry API.
"""
import sys
import os
from pathlib import Path

# Add the backend directory to the path
backend_dir = Path(__file__).parent.parent
sys.path.insert(0, str(backend_dir))

# Import the FastAPI app
from app import app

# Vercel expects the app to be available as 'app'
# This is the entry point for Vercel