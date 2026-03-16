"""
Chemistry calculation API routes.
"""
from fastapi import APIRouter, HTTPException
from typing import List
import logging

from models.schemas import (
    PairChemistryRequest,
    PairChemistryResponse,
    TeamChemistryRequest,
    TeamChemistryResponse,
    PlayerBasic,
    ChemistryResult,
    PlayerPairChemistry
)
from services.data_loader import data_loader
from services.chemistry_calculator import chemistry_calculator

logger = logging.getLogger(__name__)
router = APIRouter()


@router.post("/pair", response_model=PairChemistryResponse)
async def calculate_pair_chemistry(request: PairChemistryRequest):
    """
    Calculate chemistry between two players.
    
    Args:
        request: PairChemistryRequest with player1_id and player2_id
        
    Returns:
        PairChemistryResponse with chemistry scores and breakdown
    """
    try:
        # Get player data
        player1 = data_loader.get_player_by_id(request.player1_id)
        player2 = data_loader.get_player_by_id(request.player2_id)
        
        if not player1:
            raise HTTPException(status_code=404, detail=f"Player {request.player1_id} not found")
        if not player2:
            raise HTTPException(status_code=404, detail=f"Player {request.player2_id} not found")
        
        # Calculate chemistry
        chemistry_result = chemistry_calculator.calculate_chemistry(player1, player2)
        
        # Prepare response
        player1_basic = PlayerBasic(
            id=player1['id'],
            short_name=player1.get('short_name', 'Unknown'),
            first_name=player1.get('first_name'),
            last_name=player1.get('last_name'),
            role_name=player1.get('role_name'),
            role_code=player1.get('role_code'),
            team_name=player1.get('team_name'),
            team_id=player1.get('team_id'),
            overall_rating=player1.get('overall_rating'),
            url_image=player1.get('url_image')
        )
        
        player2_basic = PlayerBasic(
            id=player2['id'],
            short_name=player2.get('short_name', 'Unknown'),
            first_name=player2.get('first_name'),
            last_name=player2.get('last_name'),
            role_name=player2.get('role_name'),
            role_code=player2.get('role_code'),
            team_name=player2.get('team_name'),
            team_id=player2.get('team_id'),
            overall_rating=player2.get('overall_rating'),
            url_image=player2.get('url_image')
        )
        
        chemistry = ChemistryResult(
            offensive_chemistry=chemistry_result['offensive_chemistry'],
            defensive_chemistry=chemistry_result['defensive_chemistry'],
            average_chemistry=chemistry_result['average_chemistry'],
            offensive_breakdown=chemistry_result['offensive_breakdown'],
            defensive_breakdown=chemistry_result['defensive_breakdown']
        )
        
        return PairChemistryResponse(
            player1=player1_basic,
            player2=player2_basic,
            chemistry=chemistry
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating pair chemistry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/team", response_model=TeamChemistryResponse)
async def calculate_team_chemistry(request: TeamChemistryRequest):
    """
    Calculate chemistry for a team of 11 players.
    
    Args:
        request: TeamChemistryRequest with player_ids, formation, and chemistry_type
        
    Returns:
        TeamChemistryResponse with total chemistry and pair details
    """
    try:
        # Validate player count
        if len(request.player_ids) != 11:
            raise HTTPException(status_code=400, detail="Team must have exactly 11 players")
        
        # Get all players
        players = []
        for player_id in request.player_ids:
            player = data_loader.get_player_by_id(player_id)
            if not player:
                raise HTTPException(status_code=404, detail=f"Player {player_id} not found")
            players.append(player)
        
        # Calculate chemistry for all pairs (55 pairs for 11 players)
        pair_chemistries = []
        total_chemistry = 0.0
        
        for i in range(len(players)):
            for j in range(i + 1, len(players)):
                player1 = players[i]
                player2 = players[j]
                
                chemistry_result = chemistry_calculator.calculate_chemistry(player1, player2)
                
                # Select chemistry type
                if request.chemistry_type == "offensive":
                    chemistry_score = chemistry_result['offensive_chemistry']
                elif request.chemistry_type == "defensive":
                    chemistry_score = chemistry_result['defensive_chemistry']
                else:  # average
                    chemistry_score = chemistry_result['average_chemistry']
                
                pair_chemistries.append(
                    PlayerPairChemistry(
                        player1_id=player1['id'],
                        player2_id=player2['id'],
                        chemistry=chemistry_score
                    )
                )
                
                total_chemistry += chemistry_score
        
        # Calculate average
        average_chemistry = total_chemistry / len(pair_chemistries) if pair_chemistries else 0
        
        # Sort pairs by chemistry
        sorted_pairs = sorted(pair_chemistries, key=lambda x: x.chemistry, reverse=True)
        
        # Get top 5 and bottom 5
        strongest_pairs = sorted_pairs[:5]
        weakest_pairs = sorted_pairs[-5:]
        
        # Create formation positions mapping (simplified)
        formation_positions = _map_formation_positions(request.formation, request.player_ids)
        
        return TeamChemistryResponse(
            total_chemistry=round(total_chemistry, 2),
            average_chemistry=round(average_chemistry, 2),
            pairs=pair_chemistries,
            strongest_pairs=strongest_pairs,
            weakest_pairs=weakest_pairs,
            formation=request.formation,
            formation_positions=formation_positions
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error calculating team chemistry: {e}")
        raise HTTPException(status_code=500, detail=str(e))


def _map_formation_positions(formation: str, player_ids: List[int]) -> dict:
    """
    Map player IDs to formation positions.
    Simplified mapping - in production, this would be more sophisticated.
    """
    positions = ['gk', 'rb', 'rcb', 'lcb', 'lb', 'rcm', 'lcm', 'rw', 'cam', 'lw', 'st']
    
    # Create mapping
    mapping = {}
    for i, player_id in enumerate(player_ids):
        if i < len(positions):
            mapping[positions[i]] = player_id
    
    return mapping
