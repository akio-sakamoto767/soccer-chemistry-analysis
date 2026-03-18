#!/usr/bin/env python3
"""
Minimal Flask API for Railway deployment test.
"""
from flask import Flask, jsonify
from flask_cors import CORS
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
CORS(app, origins=["*"])

@app.route('/', methods=['GET'])
def root():
    """Root endpoint."""
    logger.info("Root endpoint accessed")
    return jsonify({
        "message": "Soccer Chemistry API",
        "status": "running",
        "version": "1.0.0"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    logger.info("Health check accessed")
    return jsonify({
        "status": "healthy",
        "message": "API is running"
    })

@app.route('/api/health', methods=['GET'])
def api_health_check():
    """API health check endpoint for Railway."""
    logger.info("API health check accessed")
    return jsonify({
        "status": "healthy",
        "message": "Soccer Chemistry API is running",
        "version": "1.0.0"
    })

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint."""
    logger.info("Test endpoint accessed")
    return jsonify({
        "message": "Test successful",
        "status": "ok"
    })

if __name__ == '__main__':
    try:
        # Get port from environment variable (Railway sets this)
        port = int(os.environ.get('PORT', 8000))
        logger.info(f"Starting Flask app on port {port}")
        
        # Run the app
        app.run(host='0.0.0.0', port=port, debug=False)
    except Exception as e:
        logger.error(f"Failed to start Flask app: {e}")
        import traceback
        traceback.print_exc()