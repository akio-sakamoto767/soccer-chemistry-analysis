"""
Pydantic models for API request and response schemas.
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


# Player models
class PlayerBasic(BaseModel):
    """Basic player information."""
    id: int
    short_name: str
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role_name: Optional[str] = None
    role_code: Optional[str] = None
    team_name: Optional[str] = None
    team_id: Optional[int] = None
    overall_rating: Optional[float] = None
    url_image: Optional[str] = None


class PlayerDetailed(PlayerBasic):
    """Detailed player information with stats."""
    age_years: Optional[float] = None
    height_cm: Optional[int] = None
    weight_kg: Optional[int] = None
    foot: Optional[str] = None
    citizenship_area_id: Optional[int] = None
    competition_name: Optional[str] = None
    competition_id: Optional[int] = None
    minutes_played: Optional[int] = None
    matches: Optional[int] = None
    goals: Optional[int] = None
    assists: Optional[int] = None
    xg_shot: Optional[float] = None
    xg_assist: Optional[float] = None
    work_rate_attack: Optional[str] = None
    work_rate_defense: Optional[str] = None


class PlayersResponse(BaseModel):
    """Response for players list."""
    players: List[PlayerBasic]
    total: int


# Chemistry models
class ChemistryBreakdown(BaseModel):
    """Breakdown of chemistry components."""
    role_compatibility: float
    stat_complementarity: float
    performance_alignment: float
    contextual_bonus: float


class ChemistryResult(BaseModel):
    """Chemistry calculation result."""
    offensive_chemistry: float = Field(..., ge=0, le=100)
    defensive_chemistry: float = Field(..., ge=0, le=100)
    average_chemistry: float = Field(..., ge=0, le=100)
    offensive_breakdown: ChemistryBreakdown
    defensive_breakdown: ChemistryBreakdown


class PairChemistryRequest(BaseModel):
    """Request for pair chemistry calculation."""
    player1_id: int
    player2_id: int


class PairChemistryResponse(BaseModel):
    """Response for pair chemistry calculation."""
    player1: PlayerBasic
    player2: PlayerBasic
    chemistry: ChemistryResult


# Team chemistry models
class PlayerPairChemistry(BaseModel):
    """Chemistry between a pair of players."""
    player1_id: int
    player2_id: int
    chemistry: float


class TeamChemistryRequest(BaseModel):
    """Request for team chemistry calculation."""
    player_ids: List[int] = Field(..., min_items=11, max_items=11)
    formation: str
    chemistry_type: str = "average"


class TeamChemistryResponse(BaseModel):
    """Response for team chemistry calculation."""
    total_chemistry: float
    average_chemistry: float
    pairs: List[PlayerPairChemistry]
    strongest_pairs: List[PlayerPairChemistry]
    weakest_pairs: List[PlayerPairChemistry]
    formation: str
    formation_positions: Dict[str, int]


# Optimizer models
class OptimizeSquadRequest(BaseModel):
    """Request for squad optimization."""
    squad_pool: List[int] = Field(..., min_items=11, max_items=30)
    formation: str
    maximize: bool = True
    weight: float = Field(default=0.5, ge=0, le=1)  # 0=defensive, 1=offensive


class OptimizeSquadResponse(BaseModel):
    """Response for squad optimization."""
    optimized_lineup: List[int]
    total_chemistry: float
    average_chemistry: float
    formation: str
    formation_positions: Dict[str, int]
    top_partnerships: List[PlayerPairChemistry]
    weakest_link: Optional[PlayerPairChemistry] = None
    players: List[PlayerBasic]


# Formation models
class Formation(BaseModel):
    """Tactical formation."""
    id: int
    name: str
    positions: Dict[str, str]


class FormationsResponse(BaseModel):
    """Response for formations list."""
    formations: List[Formation]


# Generic responses
class HealthResponse(BaseModel):
    """Health check response."""
    status: str
    message: str


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
