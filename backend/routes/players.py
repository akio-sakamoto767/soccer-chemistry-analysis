"""
Player data API routes.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
import logging

from models.schemas import (
    PlayersResponse,
    PlayerBasic,
    PlayerDetailed,
    FormationsResponse,
    Formation
)
from services.data_loader import data_loader

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get("", response_model=PlayersResponse)
async def get_players(
    search: Optional[str] = Query(None, description="Search by player name"),
    team_id: Optional[int] = Query(None, description="Filter by team ID"),
    competition_id: Optional[int] = Query(None, description="Filter by competition ID"),
    role_code: Optional[str] = Query(None, description="Filter by role (FWD, MID, DEF, GK)"),
    min_minutes: int = Query(500, description="Minimum minutes played"),
    limit: int = Query(100, ge=1, le=500, description="Maximum number of results")
):
    """
    Get list of players with optional filters.
    
    Args:
        search: Search term for player name
        team_id: Filter by team
        competition_id: Filter by competition
        role_code: Filter by position role
        min_minutes: Minimum minutes played
        limit: Maximum results to return
        
    Returns:
        PlayersResponse with list of players
    """
    try:
        players = data_loader.get_players(
            search=search,
            team_id=team_id,
            competition_id=competition_id,
            role_code=role_code,
            min_minutes=min_minutes,
            limit=limit
        )
        
        # Convert to PlayerBasic models
        player_basics = []
        for player in players:
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
        
        return PlayersResponse(
            players=player_basics,
            total=len(player_basics)
        )
        
    except Exception as e:
        logger.error(f"Error getting players: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{player_id}", response_model=PlayerDetailed)
async def get_player(player_id: int):
    """
    Get detailed information for a specific player.
    
    Args:
        player_id: Player ID
        
    Returns:
        PlayerDetailed with full player information
    """
    try:
        player = data_loader.get_player_by_id(player_id)
        
        if not player:
            raise HTTPException(status_code=404, detail=f"Player {player_id} not found")
        
        return PlayerDetailed(
            id=player['id'],
            short_name=player.get('short_name', 'Unknown'),
            first_name=player.get('first_name'),
            last_name=player.get('last_name'),
            role_name=player.get('role_name'),
            role_code=player.get('role_code'),
            team_name=player.get('team_name'),
            team_id=player.get('team_id'),
            overall_rating=player.get('overall_rating'),
            url_image=player.get('url_image'),
            age_years=player.get('age_years'),
            height_cm=player.get('height_cm'),
            weight_kg=player.get('weight_kg'),
            foot=player.get('foot'),
            citizenship_area_id=player.get('citizenship_area_id'),
            competition_name=player.get('competition_name'),
            competition_id=player.get('competition_id'),
            minutes_played=player.get('minutes_played'),
            matches=player.get('matches'),
            goals=player.get('goals'),
            assists=player.get('assists'),
            xg_shot=player.get('xg_shot'),
            xg_assist=player.get('xg_assist'),
            work_rate_attack=player.get('work_rate_attack'),
            work_rate_defense=player.get('work_rate_defense')
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting player {player_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/formations/all", response_model=FormationsResponse)
async def get_formations():
    """
    Get all available tactical formations.
    
    Returns:
        FormationsResponse with list of formations
    """
    try:
        formations_data = data_loader.get_all_formations()
        
        formations = []
        for formation in formations_data:
            # Extract positions from formation data
            positions = {}
            for i in range(11):
                pos_key = f"p{i}"
                if pos_key in formation:
                    positions[pos_key] = formation[pos_key]
            
            formations.append(
                Formation(
                    id=formation['id'],
                    name=formation['name'],
                    positions=positions
                )
            )
        
        return FormationsResponse(formations=formations)
        
    except Exception as e:
        logger.error(f"Error getting formations: {e}")
        raise HTTPException(status_code=500, detail=str(e))
