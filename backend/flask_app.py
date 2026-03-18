#!/usr/bin/env python3
"""
Simple Flask API for Soccer Chemistry - Python 3.13 compatible.
"""
from flask import Flask, jsonify, request
from flask_cors import CORS
import sys
import os
import logging

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from services.data_loader import DataLoader
from services.chemistry_calculator import chemistry_calculator
from services.squad_optimizer import squad_optimizer

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
    "https://frontend-xz52euflz-itbusiness999code-2109s-projects.vercel.app",  # Vercel production alternative
    "https://*.vercel.app"  # All Vercel deployments for this project
]

CORS(app, origins=cors_origins)

# Initialize data loader
data_loader = DataLoader()

# Load data on startup (non-blocking)
def initialize_data():
    """Load data on startup."""
    try:
        # Try to load data if available
        if os.path.exists("../data"):
            data_loader.load_data("../data")
            logger.info("Data loaded successfully from ../data")
        elif os.path.exists("data"):
            data_loader.load_data("data")
            logger.info("Data loaded successfully from data")
        else:
            logger.warning("No data directory found - running without preloaded data")
            logger.info("Data will be loaded on-demand from external source")
    except Exception as e:
        logger.error(f"Failed to load data: {e}")
        logger.info("Continuing without preloaded data - will use external data source")

# Try to initialize data, but don't fail if it doesn't work
try:
    initialize_data()
except Exception as e:
    logger.error(f"Data initialization failed: {e}")
    logger.info("App will continue without preloaded data")

# Root endpoint
@app.route('/', methods=['GET'])
def root():
    """Root endpoint with API information."""
    try:
        # Try to get players, but don't fail if data isn't loaded
        try:
            players = data_loader.get_players(limit=1)
            data_loaded = len(players) > 0
        except:
            data_loaded = False
            
        return jsonify({
            "message": "Soccer Chemistry API",
            "status": "running",
            "data_loaded": data_loaded,
            "endpoints": {
                "health": "/health",
                "api_health": "/api/health",
                "debug": "/debug", 
                "players": "/api/players",
                "chemistry": "/api/chemistry/pair",
                "team_chemistry": "/api/chemistry/team",
                "optimize": "/api/optimize"
            }
        })
    except Exception as e:
        logger.error(f"Root endpoint error: {e}")
        return jsonify({
            "message": "Soccer Chemistry API",
            "status": "running",
            "error": "Data loading issues",
            "data_loaded": False
        })

# Debug endpoint
@app.route('/debug', methods=['GET'])
def debug_info():
    """Debug information."""
    try:
        # Check raw data
        raw_players = len(data_loader.players_data)
        enriched_players = len(data_loader.players_enriched)
        
        # Get first few raw players
        first_raw = data_loader.players_data[:3] if data_loader.players_data else []
        first_enriched = data_loader.players_enriched[:3] if data_loader.players_enriched else []
        
        # Check players with different minute thresholds
        players_0_min = data_loader.get_players(min_minutes=0, limit=5)
        players_100_min = data_loader.get_players(min_minutes=100, limit=5)
        players_500_min = data_loader.get_players(min_minutes=500, limit=5)
        
        return jsonify({
            "raw_players_count": raw_players,
            "enriched_players_count": enriched_players,
            "first_raw_players": first_raw,
            "first_enriched_players": first_enriched,
            "players_with_0_min": len(players_0_min),
            "players_with_100_min": len(players_100_min),
            "players_with_500_min": len(players_500_min),
            "data_loader_initialized": data_loader is not None
        })
    except Exception as e:
        logger.error(f"Debug error: {e}")
        return jsonify({"error": str(e)}), 500

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
        "version": "1.0.0"
    })

# Data status endpoint
@app.route('/api/data/status', methods=['GET'])
def data_status():
    """Get data loading status and information."""
    try:
        from data_manager import data_manager
        
        info = data_manager.get_data_info()
        
        return jsonify({
            "status": "success",
            "data": info,
            "message": "Data is ready" if info["is_complete"] else "Data incomplete"
        })
    except Exception as e:
        return jsonify({
            "status": "error",
            "error": str(e)
        }), 500

# Players endpoints
@app.route('/api/players', methods=['GET'])
def get_players():
    """Get all players with optional search."""
    try:
        search = request.args.get('search', '')
        limit = int(request.args.get('limit', 50))
        min_minutes = int(request.args.get('min_minutes', 0))
        
        players = data_loader.get_players(search=search, limit=limit, min_minutes=min_minutes)
        
        logger.info(f"Players request: search='{search}', limit={limit}, min_minutes={min_minutes}, found={len(players)}")
        
        return jsonify({
            "players": players,
            "total": len(players)
        })
    except Exception as e:
        logger.error(f"Error in get_players: {e}")
        return jsonify({"error": str(e)}), 500

@app.route('/api/players/<int:player_id>', methods=['GET'])
def get_player(player_id):
    """Get specific player details."""
    try:
        # Convert to string since CSV data has string IDs
        player = data_loader.get_player_by_id(str(player_id))
        if not player:
            return jsonify({"error": "Player not found"}), 404
        
        return jsonify(player)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Chemistry endpoints
@app.route('/api/chemistry/pair', methods=['POST'])
def calculate_pair_chemistry():
    """Calculate chemistry between two players."""
    try:
        data = request.get_json()
        player1_id = data.get('player1_id')
        player2_id = data.get('player2_id')
        
        if not player1_id or not player2_id:
            return jsonify({"error": "Both player IDs required"}), 400
        
        player1 = data_loader.get_player_by_id(str(player1_id))
        player2 = data_loader.get_player_by_id(str(player2_id))
        
        if not player1 or not player2:
            return jsonify({"error": "One or both players not found"}), 404
        
        chemistry = chemistry_calculator.calculate_chemistry(player1, player2)
        
        return jsonify({
            "player1": player1,
            "player2": player2,
            "chemistry": chemistry
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/chemistry/team', methods=['POST'])
def calculate_team_chemistry():
    """Calculate chemistry for a team."""
    try:
        data = request.get_json()
        player_ids = data.get('player_ids', [])
        formation = data.get('formation', '4-3-3')
        chemistry_type = data.get('chemistry_type', 'average')
        
        if len(player_ids) != 11:
            return jsonify({"error": "Exactly 11 players required"}), 400
        
        # Get players
        players = []
        for pid in player_ids:
            player = data_loader.get_player_by_id(str(pid))
            if not player:
                return jsonify({"error": f"Player {pid} not found"}), 404
            players.append(player)
        
        # Calculate all pair chemistry
        pairs = []
        total_chemistry = 0
        
        for i in range(len(players)):
            for j in range(i + 1, len(players)):
                chemistry = chemistry_calculator.calculate_chemistry(players[i], players[j])
                chemistry_score = chemistry['average_chemistry']
                
                pairs.append({
                    "player1_id": players[i]['id'],
                    "player2_id": players[j]['id'],
                    "chemistry": chemistry_score
                })
                total_chemistry += chemistry_score
        
        average_chemistry = total_chemistry / len(pairs) if pairs else 0
        
        # Sort pairs for strongest/weakest
        sorted_pairs = sorted(pairs, key=lambda x: x['chemistry'], reverse=True)
        
        return jsonify({
            "total_chemistry": round(total_chemistry, 2),
            "average_chemistry": round(average_chemistry, 2),
            "pairs": pairs,
            "strongest_pairs": sorted_pairs[:5],
            "weakest_pairs": sorted_pairs[-5:],
            "formation": formation,
            "formation_positions": {}
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Optimizer endpoint
@app.route('/api/optimize', methods=['POST'])
def optimize_squad():
    """Optimize squad selection."""
    try:
        data = request.get_json()
        squad_pool_ids = data.get('squad_pool', [])
        formation = data.get('formation', '4-3-3')
        maximize = data.get('maximize', True)
        weight = data.get('weight', 0.5)
        
        if len(squad_pool_ids) < 11:
            return jsonify({"error": "At least 11 players required in squad pool"}), 400
        
        # Get players
        squad_pool = []
        for pid in squad_pool_ids:
            player = data_loader.get_player_by_id(str(pid))
            if not player:
                return jsonify({"error": f"Player {pid} not found"}), 404
            squad_pool.append(player)
        
        # Optimize
        result = squad_optimizer.optimize_squad(squad_pool, formation, maximize, weight)
        
        # Get player details for optimized lineup
        optimized_players = []
        for pid in result['optimized_lineup']:
            player = data_loader.get_player_by_id(str(pid))
            if player:
                optimized_players.append(player)
        
        result['players'] = optimized_players
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Formations endpoint
@app.route('/api/formations', methods=['GET'])
@app.route('/api/players/formations/all', methods=['GET'])  # Add alternative endpoint
def get_formations():
    """Get available formations."""
    formations = [
        {"id": 1, "name": "4-3-3", "positions": {"gk": 1, "def": 4, "mid": 3, "fwd": 3}},
        {"id": 2, "name": "4-4-2", "positions": {"gk": 1, "def": 4, "mid": 4, "fwd": 2}},
        {"id": 3, "name": "4-2-3-1", "positions": {"gk": 1, "def": 4, "mid": 5, "fwd": 1}},
        {"id": 4, "name": "3-5-2", "positions": {"gk": 1, "def": 3, "mid": 5, "fwd": 2}},
        {"id": 5, "name": "3-4-3", "positions": {"gk": 1, "def": 3, "mid": 4, "fwd": 3}},
        {"id": 6, "name": "5-3-2", "positions": {"gk": 1, "def": 5, "mid": 3, "fwd": 2}},
    ]
    
    return jsonify({"formations": formations})

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
        sys.exit(1)