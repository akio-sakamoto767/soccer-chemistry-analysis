"""
Squad optimizer service for selecting optimal lineups.
"""
from typing import List, Dict, Optional
import logging
from itertools import combinations

from services.chemistry_calculator import chemistry_calculator

logger = logging.getLogger(__name__)


class SquadOptimizer:
    """Optimizer for selecting best starting XI from squad pool."""
    
    # Position requirements for common formations
    FORMATION_POSITIONS = {
        '4-4-2': ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
        '4-3-3': ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'],
        '4-2-3-1': ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD'],
        '3-5-2': ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
        '3-4-3': ['GK', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'MID', 'FWD', 'FWD', 'FWD'],
        '5-3-2': ['GK', 'DEF', 'DEF', 'DEF', 'DEF', 'DEF', 'MID', 'MID', 'MID', 'FWD', 'FWD'],
    }
    
    def optimize_squad(
        self,
        squad_pool: List[Dict],
        formation: str,
        maximize: bool = True,
        weight: float = 0.5
    ) -> Dict:
        """
        Optimize squad selection using greedy algorithm.
        
        Args:
            squad_pool: List of player dictionaries
            formation: Formation name (e.g., '4-3-3')
            maximize: True to maximize chemistry, False to minimize
            weight: Weight between offensive (1.0) and defensive (0.0) chemistry
            
        Returns:
            Dictionary with optimized lineup and statistics
        """
        logger.info(f"Optimizing squad with formation {formation}, maximize={maximize}, weight={weight}")
        
        # Get position requirements
        position_requirements = self.FORMATION_POSITIONS.get(
            formation,
            self.FORMATION_POSITIONS['4-3-3']  # Default
        )
        
        # Use greedy algorithm for speed
        optimized_lineup = self._greedy_optimize(
            squad_pool,
            position_requirements,
            maximize,
            weight
        )
        
        # Calculate final chemistry
        total_chemistry, pairs = self._calculate_lineup_chemistry(
            optimized_lineup,
            weight
        )
        
        average_chemistry = total_chemistry / len(pairs) if pairs else 0
        
        # Get top and weakest partnerships
        sorted_pairs = sorted(pairs, key=lambda x: x['chemistry'], reverse=True)
        top_partnerships = sorted_pairs[:5]
        weakest_link = sorted_pairs[-1] if sorted_pairs else None
        
        # Create formation positions mapping
        formation_positions = {}
        position_names = ['gk', 'rb', 'rcb', 'lcb', 'lb', 'rdm', 'ldm', 'rcm', 'lcm', 'rw', 'lw']
        for i, player in enumerate(optimized_lineup):
            if i < len(position_names):
                formation_positions[position_names[i]] = player['id']
        
        return {
            'optimized_lineup': [p['id'] for p in optimized_lineup],
            'total_chemistry': round(total_chemistry, 2),
            'average_chemistry': round(average_chemistry, 2),
            'formation': formation,
            'formation_positions': formation_positions,
            'top_partnerships': top_partnerships,
            'weakest_link': weakest_link
        }
    
    def _greedy_optimize(
        self,
        squad_pool: List[Dict],
        position_requirements: List[str],
        maximize: bool,
        weight: float
    ) -> List[Dict]:
        """
        Greedy algorithm for squad optimization.
        Selects players one by one to maximize/minimize chemistry.
        """
        lineup = []
        available_players = squad_pool.copy()
        
        for required_position in position_requirements:
            best_player = None
            best_score = float('-inf') if maximize else float('inf')
            
            # Filter players who can play this position
            compatible_players = [
                p for p in available_players
                if self._can_play_position(p, required_position)
            ]
            
            if not compatible_players:
                # Fallback: use any available player
                compatible_players = available_players
            
            # Try each compatible player
            for candidate in compatible_players:
                # Calculate chemistry with current lineup
                if len(lineup) == 0:
                    # First player, just add them
                    score = 0
                else:
                    score = self._calculate_candidate_chemistry(
                        candidate,
                        lineup,
                        weight
                    )
                
                # Check if this is better
                if maximize:
                    if score > best_score:
                        best_score = score
                        best_player = candidate
                else:
                    if score < best_score:
                        best_score = score
                        best_player = candidate
            
            # Add best player to lineup
            if best_player:
                lineup.append(best_player)
                available_players.remove(best_player)
            elif available_players:
                # Fallback: add first available player
                lineup.append(available_players[0])
                available_players.pop(0)
        
        return lineup
    
    def _can_play_position(self, player: Dict, required_position: str) -> bool:
        """Check if player can play the required position."""
        player_role = player.get('role_code', '')
        
        # Simple position matching
        if required_position == 'GK':
            return player_role == 'GK'
        elif required_position == 'DEF':
            return player_role in ['DEF', 'GK']  # Allow GK as backup
        elif required_position == 'MID':
            return player_role in ['MID', 'DEF', 'FWD']  # Flexible
        elif required_position == 'FWD':
            return player_role in ['FWD', 'MID']
        
        return True  # Fallback: allow any position
    
    def _calculate_candidate_chemistry(
        self,
        candidate: Dict,
        current_lineup: List[Dict],
        weight: float
    ) -> float:
        """Calculate total chemistry if candidate is added to lineup."""
        total_chemistry = 0.0
        
        for player in current_lineup:
            chemistry_result = chemistry_calculator.calculate_chemistry(candidate, player)
            
            # Weighted combination of offensive and defensive
            chemistry_score = (
                weight * chemistry_result['offensive_chemistry'] +
                (1 - weight) * chemistry_result['defensive_chemistry']
            )
            
            total_chemistry += chemistry_score
        
        return total_chemistry
    
    def _calculate_lineup_chemistry(
        self,
        lineup: List[Dict],
        weight: float
    ) -> tuple:
        """Calculate total chemistry for a complete lineup."""
        pairs = []
        total_chemistry = 0.0
        
        for i in range(len(lineup)):
            for j in range(i + 1, len(lineup)):
                player1 = lineup[i]
                player2 = lineup[j]
                
                chemistry_result = chemistry_calculator.calculate_chemistry(player1, player2)
                
                # Weighted combination
                chemistry_score = (
                    weight * chemistry_result['offensive_chemistry'] +
                    (1 - weight) * chemistry_result['defensive_chemistry']
                )
                
                pairs.append({
                    'player1_id': player1['id'],
                    'player2_id': player2['id'],
                    'chemistry': round(chemistry_score, 2)
                })
                
                total_chemistry += chemistry_score
        
        return total_chemistry, pairs


# Global instance
squad_optimizer = SquadOptimizer()
