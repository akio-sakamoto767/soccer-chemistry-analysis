"""
Squad optimizer API routes.
"""
from fastapi import APIRouter, HTTPException
import logging

from models.schemas import (
    OptimizeSquadRequest,
    OptimizeSquadResponse,
    PlayerBasic,
    PlayerPairChemistry
)
from services.data_loader import data_loader
from services.squad_optimizer import squad_optimizer

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("", response_model=OptimizeSquadResponse)
async def optimize_squad(request: OptimizeSquadRequest):
    """
    Optimize squad selection to maximize or minimize chemistry.
    
    Args:
        request: OptimizeSquadRequest with squad pool, formation, and optimization parameters
        
    Returns:
        OptimizeSquadResponse with optimized lineup
    """
    try:
        # Validate squad pool size
        if len(request.squad_pool) < 11:
            raise HTTPException(
                status_code=400,
                detail="Squad pool must have at least 11 players"
            )
        
        if len(request.squad_pool) > 30:
            raise HTTPException(
                status_code=400,
                detail="Squad pool cannot exceed 30 players"
            )
        
        # Get all players in squad pool
        squad_players = []
        for player_id in request.squad_pool:
            player = data_loader.get_player_by_id(player_id)
            if not player:
                raise HTTPException(
                    status_code=404,
                    detail=f"Player {player_id} not found"
                )
            squad_players.append(player)
        
        # Run optimization
        result = squad_optimizer.optimize_squad(
            squad_pool=squad_players,
            formation=request.formation,
            maximize=request.maximize,
            weight=request.weight
        )
        
        # Convert players to PlayerBasic
        player_basics = []
        for player_id in result['optimized_lineup']:
            player = data_loader.get_player_by_id(player_id)
            if player:
                player_basics.append(
                    PlayerBasic(
                        id=player['id'],
                        short_name=player.get('short_name', 'Unknown'),
                        first_name=player.get('first_name'),
                        last_name=player.get('last_name'),
                        role_name=player.get('role_name'),
                        role_code=player.get('role_code'),
                        team_name=player.get('team_name'),
                        team_id=player.get('team_id'),
                        overall_rating=player.get('overall_rating'),
                        url_image=player.get('url_image')
                    )
                )
        
        # Convert partnerships
        top_partnerships = [
            PlayerPairChemistry(**pair) for pair in result['top_partnerships']
        ]
        
        weakest_link = None
        if result.get('weakest_link'):
            weakest_link = PlayerPairChemistry(**result['weakest_link'])
        
        return OptimizeSquadResponse(
            optimized_lineup=result['optimized_lineup'],
            total_chemistry=result['total_chemistry'],
            average_chemistry=result['average_chemistry'],
            formation=result['formation'],
            formation_positions=result['formation_positions'],
            top_partnerships=top_partnerships,
            weakest_link=weakest_link,
            players=player_basics
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error optimizing squad: {e}")
        raise HTTPException(status_code=500, detail=str(e))
