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

from services.data_loader import data_loader
from services.chemistry_calculator import chemistry_calculator
from services.squad_optimizer import squad_optimizer

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)

# Configure CORS - Allow all origins for development
CORS(app, origins="*", supports_credentials=True)

# Data loader is already initialized as singleton

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
        
        result = data_loader.get_players(search=search, limit=limit, min_minutes=min_minutes)
        
        # Extract players array from result dict
        players_list = result.get("players", [])
        total_count = result.get("total", 0)
        
        logger.info(f"Players request: search='{search}', limit={limit}, min_minutes={min_minutes}, returned={len(players_list)}, total={total_count}")
        
        return jsonify({
            "players": players_list,
            "total": total_count
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
                
                # Use the appropriate chemistry type based on user selection
                if chemistry_type == 'offensive':
                    chemistry_score = chemistry['offensive_chemistry']
                elif chemistry_type == 'defensive':
                    chemistry_score = chemistry['defensive_chemistry']
                else:  # 'average' or default
                    chemistry_score = chemistry['average_chemistry']
                
                pairs.append({
                    "player1_id": players[i]['id'],
                    "player2_id": players[j]['id'],
                    "chemistry": chemistry_score,
                    "offensive_chemistry": chemistry['offensive_chemistry'],
                    "defensive_chemistry": chemistry['defensive_chemistry'],
                    "average_chemistry": chemistry['average_chemistry']
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
            "formation_positions": {},
            "chemistry_type": chemistry_type  # Include which type was used
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
        
        # Get player details for optimized lineup with proper formatting
        optimized_players = []
        for pid in result['optimized_lineup']:
            player = data_loader.get_player_by_id(str(pid))
            if player:
                # Format player data with safe type conversion
                # Use attr_overall_rating instead of overall_rating
                overall_rating = player.get('attr_overall_rating') or player.get('overall_rating')
                team_id = player.get('team_id') or player.get('contract_team_id')
                
                formatted_player = {
                    'id': int(float(player.get('id'))) if player.get('id') else None,
                    'short_name': player.get('short_name', 'Unknown'),
                    'first_name': player.get('first_name'),
                    'last_name': player.get('last_name'),
                    'role_name': player.get('role_name'),
                    'role_code': player.get('role_code'),
                    'team_name': player.get('team_name'),
                    'team_id': int(float(team_id)) if team_id and team_id != '' else None,
                    'overall_rating': float(overall_rating) if overall_rating and overall_rating != '' else None,
                    'url_image': player.get('url_image')
                }
                optimized_players.append(formatted_player)
        
        result['players'] = optimized_players
        
        return jsonify(result)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Helper function to create squad pool for optimization
def create_squad_pool(positions_needed, min_rating, pool_size, chemistry_type='balanced'):
    """
    Create a strategy-specific squad pool with players from all positions.
    
    Args:
        positions_needed: Dict mapping role codes to counts (e.g., {'GKP': 1, 'DEF': 4})
        min_rating: Minimum overall rating threshold
        pool_size: Target size of the pool
        chemistry_type: 'offensive', 'balanced', or 'defensive' - affects player selection
        
    Returns:
        List of player dictionaries
    """
    squad_pool = []
    all_players = data_loader.players_enriched
    
    # Calculate how many players needed per position
    position_counts = {}
    for role_code, count in positions_needed.items():
        position_counts[role_code] = count
    
    # Calculate players per position (ensure at least 2-3x the required count)
    total_positions = len(position_counts)
    players_per_position = max(pool_size // total_positions, 20)  # At least 20 per position
    
    logger.info(f"Creating squad pool: {players_per_position} players per position, chemistry_type={chemistry_type}")
    
    for role_code, count_needed in position_counts.items():
        # Get players for this position
        position_players = [
            p for p in all_players
            if p.get('role_code') == role_code
        ]
        
        # Helper to get rating
        def get_rating(player):
            rating = player.get('attr_overall_rating') or player.get('overall_rating') or 0
            try:
                return float(rating) if rating else 0
            except:
                return 0
        
        # Helper to get work rate score based on chemistry type
        def get_work_rate_score(player):
            # Work rates are stored as both 'work_rate_attack' and 'attr_work_rate_attack'
            work_rate_attack = player.get('work_rate_attack') or player.get('attr_work_rate_attack', 'Medium')
            work_rate_defense = player.get('work_rate_defense') or player.get('attr_work_rate_defense', 'Medium')
            
            attack_score = {'High': 3, 'Medium': 2, 'Low': 1}.get(work_rate_attack, 2)
            defense_score = {'High': 3, 'Medium': 2, 'Low': 1}.get(work_rate_defense, 2)
            
            if chemistry_type == 'offensive':
                # Prioritize high attacking work rate
                return attack_score * 2 + defense_score
            elif chemistry_type == 'defensive':
                # Prioritize high defensive work rate
                return defense_score * 2 + attack_score
            else:  # balanced
                return attack_score + defense_score
        
        # Strategy-specific sorting
        if chemistry_type == 'offensive':
            # For offensive: prioritize FWD/MID with high attacking work rate
            if role_code in ['FWD', 'MID']:
                # Sort by: work rate (attacking) + rating
                position_players.sort(key=lambda p: (get_work_rate_score(p), get_rating(p)), reverse=True)
            else:
                # For DEF/GKP in offensive mode, still prioritize rating but consider work rate
                position_players.sort(key=lambda p: (get_rating(p), get_work_rate_score(p)), reverse=True)
        
        elif chemistry_type == 'defensive':
            # For defensive: prioritize DEF/GKP with high defensive work rate
            if role_code in ['DEF', 'GKP']:
                # Sort by: work rate (defensive) + rating
                position_players.sort(key=lambda p: (get_work_rate_score(p), get_rating(p)), reverse=True)
            else:
                # For FWD/MID in defensive mode, still prioritize rating but consider work rate
                position_players.sort(key=lambda p: (get_rating(p), get_work_rate_score(p)), reverse=True)
        
        else:  # balanced
            # For balanced: prioritize overall rating with balanced work rates
            position_players.sort(key=lambda p: (get_rating(p), get_work_rate_score(p)), reverse=True)
        
        # Filter by min_rating
        filtered = [p for p in position_players if get_rating(p) >= min_rating]
        
        # If not enough high-rated players, lower threshold
        min_required = count_needed * 3  # At least 3x the required count
        if len(filtered) < min_required:
            logger.warning(f"Only {len(filtered)} {role_code} players with rating >={min_rating}, using top {min_required}")
            filtered = position_players[:min_required]
        
        # Take top N for this position (now sorted by strategy-specific criteria)
        selected = filtered[:players_per_position]
        squad_pool.extend(selected)
        
        avg_rating = sum(get_rating(p) for p in selected) / len(selected) if selected else 0
        logger.info(f"Added {len(selected)} {role_code} players to pool (avg rating: {avg_rating:.1f}, strategy: {chemistry_type})")
    
    logger.info(f"Squad pool created: {len(squad_pool)} total players (strategy-optimized for {chemistry_type})")
    return squad_pool


# Helper function to format player data
def format_player_data(player):
    """Format player data for API response."""
    overall_rating = player.get('attr_overall_rating') or player.get('overall_rating')
    team_id = player.get('team_id') or player.get('contract_team_id')
    
    return {
        'id': int(float(player.get('id'))) if player.get('id') else None,
        'short_name': player.get('short_name', 'Unknown'),
        'first_name': player.get('first_name'),
        'last_name': player.get('last_name'),
        'role_name': player.get('role_name'),
        'role_code': player.get('role_code'),
        'team_name': player.get('team_name'),
        'team_id': int(float(team_id)) if team_id and team_id != '' else None,
        'overall_rating': float(overall_rating) if overall_rating and overall_rating != '' else None,
        'url_image': player.get('url_image')
    }


# Recommend team endpoint (OPTIMIZED VERSION)
@app.route('/api/recommend-team', methods=['POST'])
def recommend_team():
    """Recommend an optimized team based on formation and chemistry."""
    try:
        data = request.get_json()
        formation = data.get('formation', '4-3-3')
        min_rating = data.get('min_rating', 70)
        chemistry_type = data.get('chemistry_type', 'balanced')
        pool_size = data.get('pool_size', 100)
        maximize = data.get('maximize', True)
        
        logger.info(f"Recommending team: formation={formation}, chemistry_type={chemistry_type}, min_rating={min_rating}")
        
        # Map chemistry_type to weight
        weight_map = {
            'offensive': 0.7,
            'balanced': 0.5,
            'defensive': 0.3
        }
        weight = weight_map.get(chemistry_type, 0.5)
        
        # Get formation requirements
        formation_map = {
            '4-3-3': {'GKP': 1, 'DEF': 4, 'MID': 3, 'FWD': 3},
            '4-4-2': {'GKP': 1, 'DEF': 4, 'MID': 4, 'FWD': 2},
            '4-2-3-1': {'GKP': 1, 'DEF': 4, 'MID': 5, 'FWD': 1},
            '3-5-2': {'GKP': 1, 'DEF': 3, 'MID': 5, 'FWD': 2},
            '3-4-3': {'GKP': 1, 'DEF': 3, 'MID': 4, 'FWD': 3},
            '5-3-2': {'GKP': 1, 'DEF': 5, 'MID': 3, 'FWD': 2},
        }
        
        positions_needed = formation_map.get(formation, formation_map['4-3-3'])
        
        # Create squad pool (pass chemistry_type for strategy-specific selection)
        squad_pool = create_squad_pool(positions_needed, min_rating, pool_size, chemistry_type)
        
        if len(squad_pool) < 11:
            return jsonify({"error": f"Insufficient players in pool: {len(squad_pool)} (need 11)"}), 400
        
        # Optimize squad using chemistry algorithm
        logger.info(f"Starting optimization with {len(squad_pool)} players, weight={weight}")
        result = squad_optimizer.optimize_squad(
            squad_pool=squad_pool,
            formation=formation,
            maximize=maximize,
            weight=weight
        )
        
        # Get player details for optimized lineup
        optimized_players = []
        for player_id in result['optimized_lineup']:
            player = data_loader.get_player_by_id(str(player_id))
            if player:
                formatted_player = format_player_data(player)
                optimized_players.append(formatted_player)
        
        logger.info(f"Optimization complete: {len(optimized_players)} players, avg_chemistry={result.get('average_chemistry', 0):.2f}")
        
        return jsonify({
            "players": optimized_players,
            "formation": formation,
            "count": len(optimized_players),
            "optimization_metadata": {
                "chemistry_type": chemistry_type,
                "weight": weight,
                "pool_size": len(squad_pool),
                "average_chemistry": result.get('average_chemistry'),
                "total_chemistry": result.get('total_chemistry'),
                "maximize": maximize
            }
        })
    except Exception as e:
        logger.error(f"Error recommending team: {e}")
        import traceback
        traceback.print_exc()
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