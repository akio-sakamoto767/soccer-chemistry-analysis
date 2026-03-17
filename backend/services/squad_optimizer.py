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
        logger.info(f"Squad pool size: {len(squad_pool)} players")
        
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
        
        # Calculate final chemistry with detailed logging
        total_chemistry, pairs = self._calculate_lineup_chemistry(
            optimized_lineup,
            weight
        )
        
        average_chemistry = total_chemistry / len(pairs) if pairs else 0
        
        # Get top and weakest partnerships with enhanced sorting
        sorted_pairs = sorted(pairs, key=lambda x: x['chemistry'], reverse=True)
        top_partnerships = sorted_pairs[:5]
        weakest_link = sorted_pairs[-1] if sorted_pairs else None
        
        # Log optimization results for debugging
        logger.info(f"Optimization complete:")
        logger.info(f"  - Total chemistry: {total_chemistry:.2f}")
        logger.info(f"  - Average chemistry: {average_chemistry:.2f}")
        logger.info(f"  - Top partnership: {top_partnerships[0]['chemistry']:.2f} if top_partnerships else 'None'}")
        logger.info(f"  - Weakest partnership: {weakest_link['chemistry']:.2f if weakest_link else 'None'}")
        logger.info(f"  - Chemistry type: {'Offensive' if weight > 0.6 else 'Defensive' if weight < 0.4 else 'Balanced'}")
        
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
            'weakest_link': weakest_link,
            'optimization_params': {
                'maximize': maximize,
                'weight': weight,
                'chemistry_type': 'offensive' if weight > 0.6 else 'defensive' if weight < 0.4 else 'balanced'
            }
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
        
        logger.info(f"Starting greedy optimization: maximize={maximize}, weight={weight}")
        
        for position_idx, required_position in enumerate(position_requirements):
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
            
            logger.info(f"Position {position_idx + 1} ({required_position}): {len(compatible_players)} candidates")
            
            # Try each compatible player
            for candidate in compatible_players:
                # Calculate chemistry with current lineup
                if len(lineup) == 0:
                    # First player: consider individual attributes for position
                    score = self._calculate_individual_score(candidate, required_position, weight)
                else:
                    score = self._calculate_candidate_chemistry(
                        candidate,
                        lineup,
                        weight
                    )
                
                # Apply position bonus/penalty based on optimization goal
                position_bonus = self._get_position_bonus(candidate, required_position, maximize, weight)
                score += position_bonus
                
                # Check if this is better
                is_better = (maximize and score > best_score) or (not maximize and score < best_score)
                
                if is_better:
                    best_score = score
                    best_player = candidate
                    logger.debug(f"  New best: {candidate.get('short_name', 'Unknown')} (score: {score:.2f})")
            
            # Add best player to lineup
            if best_player:
                lineup.append(best_player)
                available_players.remove(best_player)
                logger.info(f"  Selected: {best_player.get('short_name', 'Unknown')} (score: {best_score:.2f})")
            elif available_players:
                # Fallback: add first available player
                fallback_player = available_players[0]
                lineup.append(fallback_player)
                available_players.pop(0)
                logger.warning(f"  Fallback selection: {fallback_player.get('short_name', 'Unknown')}")
        
        return lineup
    
    def _calculate_individual_score(self, player: Dict, position: str, weight: float) -> float:
        """Calculate individual player score for first selection."""
        # Base score from overall rating
        base_score = player.get('overall_rating', 50)
        
        # Position compatibility bonus
        role_code = player.get('role_code', '')
        position_match = 0
        
        if position == 'GK' and role_code == 'GK':
            position_match = 20
        elif position == 'DEF' and role_code == 'DEF':
            position_match = 15
        elif position == 'MID' and role_code == 'MID':
            position_match = 15
        elif position == 'FWD' and role_code == 'FWD':
            position_match = 15
        
        # Weight-based adjustments
        if weight > 0.6:  # Offensive focus
            if role_code in ['FWD', 'MID']:
                position_match += 10
        elif weight < 0.4:  # Defensive focus
            if role_code in ['DEF', 'GK']:
                position_match += 10
        
        return base_score + position_match
    
    def _get_position_bonus(self, player: Dict, position: str, maximize: bool, weight: float) -> float:
        """Calculate position-specific bonus based on optimization parameters."""
        role_code = player.get('role_code', '')
        bonus = 0
        
        # Offensive weight bonuses
        if weight > 0.6:  # Offensive focus
            if position in ['FWD', 'MID'] and role_code in ['FWD', 'MID']:
                bonus += 5 if maximize else -5
        
        # Defensive weight bonuses  
        elif weight < 0.4:  # Defensive focus
            if position in ['DEF', 'GK'] and role_code in ['DEF', 'GK']:
                bonus += 5 if maximize else -5
        
        # Work rate considerations
        work_rate_attack = player.get('work_rate_attack', 'Medium')
        work_rate_defense = player.get('work_rate_defense', 'Medium')
        
        if weight > 0.6 and work_rate_attack == 'High':
            bonus += 3 if maximize else -3
        elif weight < 0.4 and work_rate_defense == 'High':
            bonus += 3 if maximize else -3
        
        return bonus
    
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
            
            # Enhanced weighted combination with amplification
            offensive_chem = chemistry_result['offensive_chemistry']
            defensive_chem = chemistry_result['defensive_chemistry']
            
            # Apply weight with amplification for more dramatic differences
            if weight > 0.7:  # Heavy offensive focus
                chemistry_score = offensive_chem * 1.2 + defensive_chem * 0.3
            elif weight > 0.5:  # Moderate offensive focus
                chemistry_score = offensive_chem * weight + defensive_chem * (1 - weight)
            elif weight < 0.3:  # Heavy defensive focus
                chemistry_score = offensive_chem * 0.3 + defensive_chem * 1.2
            else:  # Moderate defensive focus or balanced
                chemistry_score = offensive_chem * weight + defensive_chem * (1 - weight)
            
            # Role-based chemistry bonuses
            role_bonus = self._calculate_role_chemistry_bonus(candidate, player, weight)
            chemistry_score += role_bonus
            
            total_chemistry += chemistry_score
        
        return total_chemistry
    
    def _calculate_role_chemistry_bonus(self, player1: Dict, player2: Dict, weight: float) -> float:
        """Calculate role-based chemistry bonus based on weight."""
        role1 = player1.get('role_code', '')
        role2 = player2.get('role_code', '')
        bonus = 0
        
        # Offensive chemistry bonuses
        if weight > 0.6:
            # FWD-MID partnerships get bonus in offensive mode
            if (role1 == 'FWD' and role2 == 'MID') or (role1 == 'MID' and role2 == 'FWD'):
                bonus += 8
            # Creative partnerships
            elif role1 == 'MID' and role2 == 'MID':
                bonus += 5
        
        # Defensive chemistry bonuses
        elif weight < 0.4:
            # DEF-DEF partnerships get bonus in defensive mode
            if role1 == 'DEF' and role2 == 'DEF':
                bonus += 8
            # DEF-GK partnerships
            elif (role1 == 'DEF' and role2 == 'GK') or (role1 == 'GK' and role2 == 'DEF'):
                bonus += 6
            # DEF-MID partnerships (defensive midfield)
            elif (role1 == 'DEF' and role2 == 'MID') or (role1 == 'MID' and role2 == 'DEF'):
                bonus += 4
        
        return bonus
    
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
                
                # Enhanced weighted combination (same as candidate calculation)
                offensive_chem = chemistry_result['offensive_chemistry']
                defensive_chem = chemistry_result['defensive_chemistry']
                
                # Apply weight with amplification for more dramatic differences
                if weight > 0.7:  # Heavy offensive focus
                    chemistry_score = offensive_chem * 1.2 + defensive_chem * 0.3
                elif weight > 0.5:  # Moderate offensive focus
                    chemistry_score = offensive_chem * weight + defensive_chem * (1 - weight)
                elif weight < 0.3:  # Heavy defensive focus
                    chemistry_score = offensive_chem * 0.3 + defensive_chem * 1.2
                else:  # Moderate defensive focus or balanced
                    chemistry_score = offensive_chem * weight + defensive_chem * (1 - weight)
                
                # Role-based chemistry bonuses
                role_bonus = self._calculate_role_chemistry_bonus(player1, player2, weight)
                chemistry_score += role_bonus
                
                pairs.append({
                    'player1_id': player1['id'],
                    'player2_id': player2['id'],
                    'chemistry': round(chemistry_score, 2),
                    'offensive_chemistry': round(offensive_chem, 2),
                    'defensive_chemistry': round(defensive_chem, 2),
                    'role_bonus': round(role_bonus, 2)
                })
                
                total_chemistry += chemistry_score
        
        return total_chemistry, pairs


# Global instance
squad_optimizer = SquadOptimizer()
