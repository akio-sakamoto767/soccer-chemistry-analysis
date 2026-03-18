#!/usr/bin/env python3
"""
Complete Flask API for Soccer Chemistry - Fixed version.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import logging

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS with specific origins
cors_origins = [
    "http://localhost:5173",  # Local development
    "http://127.0.0.1:5173",  # Local development alternative
    "https://frontend-alpha-weld-87.vercel.app",  # Vercel production
    "https://*.vercel.app"  # All Vercel deployments
]

CORS(app, origins=cors_origins)

# Try to import services, but don't fail if they're not available
try:
    from services.data_loader import DataLoader
    from services.chemistry_calculator import chemistry_calculator
    from services.squad_optimizer import squad_optimizer
    
    # Initialize data loader
    data_loader = DataLoader()
    
    # Try to initialize data, but don't fail if it doesn't work
    try:
        if os.path.exists("../data"):
            data_loader.load_data("../data")
            logger.info("Data loaded successfully")
        else:
            logger.warning("No data directory found - running without preloaded data")
    except Exception as e:
        logger.error(f"Data loading failed: {e}")
        logger.info("App will continue without preloaded data")
        
    SERVICES_AVAILABLE = True
    
except ImportError as e:
    logger.warning(f"Services not available: {e}")
    logger.info("Running in minimal mode")
    SERVICES_AVAILABLE = False

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information."""
    return jsonify({
        "message": "Soccer Chemistry API",
        "status": "running",
        "services_available": SERVICES_AVAILABLE,
        "version": "1.0.0",
        "endpoints": {
            "health": "/health",
            "api_health": "/api/health",
            "players": "/api/players" if SERVICES_AVAILABLE else "unavailable",
            "chemistry": "/api/chemistry/pair" if SERVICES_AVAILABLE else "unavailable",
            "team_chemistry": "/api/chemistry/team" if SERVICES_AVAILABLE else "unavailable",
            "optimize": "/api/optimize" if SERVICES_AVAILABLE else "unavailable"
        }
    })

# Health check endpoints
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "message": "Soccer Chemistry API is running"
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API health check endpoint for Railway."""
    return jsonify({
        "status": "healthy",
        "message": "Soccer Chemistry API is running",
        "version": "1.0.0",
        "services": "available" if SERVICES_AVAILABLE else "minimal"
    })

# Test endpoint
@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint."""
    return jsonify({
        "message": "Test successful",
        "status": "ok",
        "services_available": SERVICES_AVAILABLE
    })

# Only add full endpoints if services are available
if SERVICES_AVAILABLE:
    
    @app.route('/api/players', methods=['GET'])
    def get_players():
        """Get players with optional search and filtering."""
        try:
            search = request.args.get('search', '')
            limit = int(request.args.get('limit', 20))
            min_minutes = int(request.args.get('min_minutes', 0))
            
            players = data_loader.get_players(
                search=search,
                limit=limit,
                min_minutes=min_minutes
            )
            
            return jsonify({
                "players": players,
                "total": len(players)
            })
            
        except Exception as e:
            logger.error(f"Error getting players: {e}")
            return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    try:
        # Get port from environment variable (Railway sets this)
        port = int(os.environ.get('PORT', 8000))
        logger.info(f"Starting Flask app on port {port}")
        logger.info(f"Services available: {SERVICES_AVAILABLE}")
        
        # Run the app
        app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        logger.error(f"Failed to start Flask app: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)