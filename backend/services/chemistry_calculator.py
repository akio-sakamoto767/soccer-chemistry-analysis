"""
Chemistry calculator service for computing player chemistry scores.
"""
import numpy as np
from typing import Dict, Tuple, Optional
import logging

logger = logging.getLogger(__name__)


class ChemistryCalculator:
    """Calculator for player chemistry metrics."""
    
    # Role compatibility matrices
    OFFENSIVE_ROLE_COMPATIBILITY = {
        ('FWD', 'FWD'): 0.5,
        ('FWD', 'MID'): 0.8,
        ('FWD', 'DEF'): 0.2,
        ('FWD', 'GK'): 0.0,
        ('MID', 'FWD'): 0.8,
        ('MID', 'MID'): 0.6,
        ('MID', 'DEF'): 0.5,
        ('MID', 'GK'): 0.1,
        ('DEF', 'FWD'): 0.2,
        ('DEF', 'MID'): 0.5,
        ('DEF', 'DEF'): 0.6,
        ('DEF', 'GK'): 0.3,
        ('GK', 'FWD'): 0.0,
        ('GK', 'MID'): 0.1,
        ('GK', 'DEF'): 0.3,
        ('GK', 'GK'): 0.0,
    }
    
    DEFENSIVE_ROLE_COMPATIBILITY = {
        ('FWD', 'FWD'): 0.4,
        ('FWD', 'MID'): 0.5,
        ('FWD', 'DEF'): 0.2,
        ('FWD', 'GK'): 0.0,
        ('MID', 'FWD'): 0.5,
        ('MID', 'MID'): 0.7,
        ('MID', 'DEF'): 0.8,
        ('MID', 'GK'): 0.3,
        ('DEF', 'FWD'): 0.2,
        ('DEF', 'MID'): 0.8,
        ('DEF', 'DEF'): 0.9,
        ('DEF', 'GK'): 0.4,
        ('GK', 'FWD'): 0.0,
        ('GK', 'MID'): 0.3,
        ('GK', 'DEF'): 0.4,
        ('GK', 'GK'): 0.0,
    }
    
    WORK_RATE_COMPATIBILITY = {
        ('High', 'High'): 1.0,
        ('High', 'Medium'): 0.8,
        ('High', 'Low'): 0.4,
        ('Medium', 'High'): 0.8,
        ('Medium', 'Medium'): 0.7,
        ('Medium', 'Low'): 0.5,
        ('Low', 'High'): 0.4,
        ('Low', 'Medium'): 0.5,
        ('Low', 'Low'): 0.3,
    }
    
    def calculate_chemistry(
        self,
        player1: Dict,
        player2: Dict
    ) -> Dict:
        """
        Calculate complete chemistry between two players.
        
        Args:
            player1: Player 1 data dictionary
            player2: Player 2 data dictionary
            
        Returns:
            Dictionary with offensive, defensive, and average chemistry scores
        """
        offensive_chem, off_breakdown = self.calculate_offensive_chemistry(player1, player2)
        defensive_chem, def_breakdown = self.calculate_defensive_chemistry(player1, player2)
        
        return {
            'offensive_chemistry': offensive_chem,
            'defensive_chemistry': defensive_chem,
            'average_chemistry': (offensive_chem + defensive_chem) / 2,
            'offensive_breakdown': off_breakdown,
            'defensive_breakdown': def_breakdown
        }
    
    def calculate_offensive_chemistry(
        self,
        player1: Dict,
        player2: Dict
    ) -> Tuple[float, Dict]:
        """Calculate offensive chemistry between two players."""
        
        # Component 1: Role compatibility
        role_compat = self._get_role_compatibility(
            player1.get('role_code'),
            player2.get('role_code'),
            offensive=True
        )
        
        # Component 2: Statistical complementarity
        stat_complement = self._calculate_stat_complementarity(player1, player2)
        
        # Component 3: Performance alignment
        perf_align = self._calculate_performance_alignment(player1, player2)
        
        # Component 4: Contextual bonus
        context_bonus = self._calculate_contextual_bonus(player1, player2)
        
        # Weighted combination
        raw_score = (
            0.40 * role_compat +
            0.40 * stat_complement +
            0.10 * perf_align +
            0.10 * context_bonus
        )
        
        # Normalize to 0-100
        final_score = raw_score * 100
        
        breakdown = {
            'role_compatibility': round(role_compat, 3),
            'stat_complementarity': round(stat_complement, 3),
            'performance_alignment': round(perf_align, 3),
            'contextual_bonus': round(context_bonus, 3)
        }
        
        return round(final_score, 2), breakdown
    
    def calculate_defensive_chemistry(
        self,
        player1: Dict,
        player2: Dict
    ) -> Tuple[float, Dict]:
        """Calculate defensive chemistry between two players."""
        
        # Component 1: Defensive role compatibility
        def_role_compat = self._get_role_compatibility(
            player1.get('role_code'),
            player2.get('role_code'),
            offensive=False
        )
        
        # Component 2: Defensive style complementarity
        def_style_complement = self._calculate_defensive_style_complementarity(player1, player2)
        
        # Component 3: Work rate compatibility
        work_rate_compat = self._calculate_work_rate_compatibility(player1, player2)
        
        # Component 4: Positional proximity
        positional_prox = self._calculate_positional_proximity(
            player1.get('role_code'),
            player2.get('role_code')
        )
        
        # Component 5: Contextual bonus
        context_bonus = self._calculate_contextual_bonus(player1, player2)
        
        # Weighted combination
        raw_score = (
            0.30 * def_role_compat +
            0.30 * def_style_complement +
            0.20 * work_rate_compat +
            0.10 * positional_prox +
            0.10 * context_bonus
        )
        
        # Normalize to 0-100
        final_score = raw_score * 100
        
        breakdown = {
            'role_compatibility': round(def_role_compat, 3),
            'stat_complementarity': round(def_style_complement, 3),
            'performance_alignment': round(work_rate_compat, 3),
            'contextual_bonus': round(context_bonus, 3)
        }
        
        return round(final_score, 2), breakdown
    
    def _get_role_compatibility(
        self,
        role1: Optional[str],
        role2: Optional[str],
        offensive: bool = True
    ) -> float:
        """Get role compatibility score from matrix."""
        if not role1 or not role2:
            return 0.5  # Default neutral score
        
        matrix = self.OFFENSIVE_ROLE_COMPATIBILITY if offensive else self.DEFENSIVE_ROLE_COMPATIBILITY
        
        # Try both orders
        score = matrix.get((role1, role2))
        if score is None:
            score = matrix.get((role2, role1), 0.5)
        
        return score
    
    def _calculate_stat_complementarity(
        self,
        player1: Dict,
        player2: Dict
    ) -> float:
        """Calculate enhanced statistical complementarity for offensive play."""
        
        # Get stats with defaults and normalize per 90 minutes
        minutes1 = max(1, player1.get('minutes_played', 1) or 1)
        minutes2 = max(1, player2.get('minutes_played', 1) or 1)
        
        # Normalize stats per 90 minutes
        p1_goals_p90 = ((player1.get('goals', 0) or 0) / minutes1) * 90
        p1_assists_p90 = ((player1.get('assists', 0) or 0) / minutes1) * 90
        p1_shots_p90 = ((player1.get('shots', 0) or 0) / minutes1) * 90
        p1_passes_p90 = ((player1.get('passes', 0) or 0) / minutes1) * 90
        p1_key_passes_p90 = ((player1.get('key_passes', 0) or 0) / minutes1) * 90
        p1_xg_assist_p90 = ((player1.get('xg_assist', 0) or 0) / minutes1) * 90
        p1_dribbles_p90 = ((player1.get('successful_dribbles', 0) or 0) / minutes1) * 90
        
        p2_goals_p90 = ((player2.get('goals', 0) or 0) / minutes2) * 90
        p2_assists_p90 = ((player2.get('assists', 0) or 0) / minutes2) * 90
        p2_shots_p90 = ((player2.get('shots', 0) or 0) / minutes2) * 90
        p2_passes_p90 = ((player2.get('passes', 0) or 0) / minutes2) * 90
        p2_key_passes_p90 = ((player2.get('key_passes', 0) or 0) / minutes2) * 90
        p2_xg_assist_p90 = ((player2.get('xg_assist', 0) or 0) / minutes2) * 90
        p2_dribbles_p90 = ((player2.get('successful_dribbles', 0) or 0) / minutes2) * 90
        
        # Calculate enhanced profiles
        p1_finishing = self._safe_divide(p1_goals_p90, p1_goals_p90 + p1_assists_p90 + 0.1)
        p2_finishing = self._safe_divide(p2_goals_p90, p2_goals_p90 + p2_assists_p90 + 0.1)
        
        p1_shot_tendency = self._safe_divide(p1_shots_p90, p1_passes_p90 + 1)
        p2_shot_tendency = self._safe_divide(p2_shots_p90, p2_passes_p90 + 1)
        
        p1_creativity = self._safe_divide(p1_key_passes_p90 + p1_xg_assist_p90, p1_passes_p90 + 1)
        p2_creativity = self._safe_divide(p2_key_passes_p90 + p2_xg_assist_p90, p2_passes_p90 + 1)
        
        p1_dribbling = self._safe_divide(p1_dribbles_p90, p1_passes_p90 + 1)
        p2_dribbling = self._safe_divide(p2_dribbles_p90, p2_passes_p90 + 1)
        
        # Enhanced complementarity analysis
        # Finisher + Creator combination works well
        finishing_complement = self._enhanced_complementarity_score(
            p1_finishing, p2_finishing, 
            optimal_diff=0.3,  # One finisher, one creator
            similarity_bonus=0.1  # But similar levels also work
        )
        
        # Shot tendency complementarity
        shot_complement = self._enhanced_complementarity_score(
            p1_shot_tendency, p2_shot_tendency,
            optimal_diff=0.05,
            similarity_bonus=0.05
        )
        
        # Creativity complementarity
        creativity_complement = self._enhanced_complementarity_score(
            p1_creativity, p2_creativity,
            optimal_diff=0.02,
            similarity_bonus=0.08
        )
        
        # Dribbling complementarity (variety is good)
        dribbling_complement = self._enhanced_complementarity_score(
            p1_dribbling, p2_dribbling,
            optimal_diff=0.03,
            similarity_bonus=0.05
        )
        
        # Weighted average (emphasize finishing and creativity)
        return (
            0.35 * finishing_complement + 
            0.25 * creativity_complement +
            0.25 * shot_complement + 
            0.15 * dribbling_complement
        )
    
    def _enhanced_complementarity_score(self, val1: float, val2: float, 
                                      optimal_diff: float, similarity_bonus: float) -> float:
        """Calculate complementarity with both difference and similarity bonuses."""
        
        diff = abs(val1 - val2)
        
        # Complementarity score (different is good)
        complement_score = np.exp(-(diff - optimal_diff) ** 2 / (2 * (optimal_diff * 0.5) ** 2))
        
        # Similarity score (similar levels also work)
        similarity_score = np.exp(-(diff ** 2) / (2 * (similarity_bonus * 2) ** 2))
        
        # Take the maximum of complementarity and similarity
        return max(complement_score, similarity_score * 0.8)
    
    def _calculate_defensive_style_complementarity(
        self,
        player1: Dict,
        player2: Dict
    ) -> float:
        """Calculate defensive style complementarity."""
        
        # Get defensive stats
        p1_tackles = player1.get('defensive_duels', 0) or 0
        p1_interceptions = player1.get('interceptions', 0) or 0
        p1_recoveries = player1.get('recoveries', 0) or 0
        p1_minutes = player1.get('minutes_played', 1) or 1
        
        p2_tackles = player2.get('defensive_duels', 0) or 0
        p2_interceptions = player2.get('interceptions', 0) or 0
        p2_recoveries = player2.get('recoveries', 0) or 0
        p2_minutes = player2.get('minutes_played', 1) or 1
        
        # Calculate rates per 90
        p1_tackle_rate = (p1_tackles / p1_minutes) * 90
        p2_tackle_rate = (p2_tackles / p2_minutes) * 90
        
        p1_interception_rate = (p1_interceptions / p1_minutes) * 90
        p2_interception_rate = (p2_interceptions / p2_minutes) * 90
        
        p1_recovery_rate = (p1_recoveries / p1_minutes) * 90
        p2_recovery_rate = (p2_recoveries / p2_minutes) * 90
        
        # Compare styles
        tackle_complement = self._complementarity_score(p1_tackle_rate, p2_tackle_rate, 5, 2)
        interception_complement = self._complementarity_score(p1_interception_rate, p2_interception_rate, 3, 1)
        recovery_complement = self._complementarity_score(p1_recovery_rate, p2_recovery_rate, 8, 4)
        
        return (tackle_complement + interception_complement + recovery_complement) / 3
    
    def _calculate_performance_alignment(
        self,
        player1: Dict,
        player2: Dict
    ) -> float:
        """Calculate enhanced performance alignment with form factors."""
        
        rating1 = player1.get('overall_rating')
        rating2 = player2.get('overall_rating')
        
        if rating1 is None or rating2 is None:
            # Estimate from stats if rating not available
            rating1 = self._estimate_rating(player1) if rating1 is None else rating1
            rating2 = self._estimate_rating(player2) if rating2 is None else rating2
        
        # Base Gaussian similarity for ratings
        diff = abs(rating1 - rating2)
        sigma = 10  # Allow 10-point difference
        base_score = np.exp(-(diff ** 2) / (2 * sigma ** 2))
        
        # Form factor based on recent performance
        form_factor = self._calculate_form_factor(player1, player2)
        
        # Combine base alignment (70%) with form factor (30%)
        final_score = (0.7 * base_score) + (0.3 * form_factor)
        
        return max(0, min(1, final_score))
    
    def _calculate_form_factor(self, player1: Dict, player2: Dict) -> float:
        """Calculate form factor based on performance vs expectation."""
        
        # Get minutes played for per-90 calculations
        minutes1 = max(1, player1.get('minutes_played', 1) or 1)
        minutes2 = max(1, player2.get('minutes_played', 1) or 1)
        
        # Actual vs expected goals (form indicator)
        goals1 = (player1.get('goals', 0) or 0) / (minutes1 / 90)
        goals2 = (player2.get('goals', 0) or 0) / (minutes2 / 90)
        xg1 = (player1.get('xg_shot', 0) or 0) / (minutes1 / 90)
        xg2 = (player2.get('xg_shot', 0) or 0) / (minutes2 / 90)
        
        # Form ratio (actual/expected)
        form1 = goals1 / max(0.1, xg1) if xg1 > 0 else 1.0
        form2 = goals2 / max(0.1, xg2) if xg2 > 0 else 1.0
        
        # Players in similar form work better together
        form_diff = abs(form1 - form2)
        form_alignment = np.exp(-(form_diff ** 2) / (2 * 0.5 ** 2))
        
        # Bonus for both players in good form
        avg_form = (form1 + form2) / 2
        if avg_form > 1.2:  # Both overperforming expectations
            form_alignment *= 1.15
        elif 0.8 <= avg_form <= 1.2:  # Both meeting expectations
            form_alignment *= 1.05
        
        return max(0, min(1, form_alignment))
    
    def _calculate_nationality_chemistry(self, player1: Dict, player2: Dict) -> float:
        """Calculate nationality-based chemistry following paper assumptions."""
        
        # Get all citizenship areas (primary and secondary)
        areas1 = [player1.get('citizenship_area_id'), player1.get('second_citizenship_area_id')]
        areas2 = [player2.get('citizenship_area_id'), player2.get('second_citizenship_area_id')]
        
        # Remove None values
        areas1 = [area for area in areas1 if area is not None]
        areas2 = [area for area in areas2 if area is not None]
        
        if not areas1 or not areas2:
            return 0.0
        
        # Check for any nationality match
        for area1 in areas1:
            if area1 in areas2:
                # Same nationality - strong communication and cultural bonus
                return 0.15
        
        # Check for regional proximity (simplified)
        # This assumes certain area_ids represent neighboring regions
        for area1 in areas1:
            for area2 in areas2:
                if self._are_neighboring_regions(area1, area2):
                    # Regional proximity - moderate cultural similarity
                    return 0.05
        
        return 0.0
    
    def _are_neighboring_regions(self, area1: int, area2: int) -> bool:
        """Check if areas represent neighboring or culturally similar regions."""
        
        # Define regional groups (this would be more comprehensive with real data)
        regional_groups = [
            # Western Europe
            [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
            # Eastern Europe  
            [11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
            # South America
            [21, 22, 23, 24, 25, 26, 27, 28, 29, 30],
            # North/Central America
            [31, 32, 33, 34, 35, 36, 37, 38, 39, 40],
            # Africa
            [41, 42, 43, 44, 45, 46, 47, 48, 49, 50],
            # Asia
            [51, 52, 53, 54, 55, 56, 57, 58, 59, 60],
        ]
        
        # Check if both areas are in the same regional group
        for group in regional_groups:
            if area1 in group and area2 in group:
                return True
        
        return False
    
    def _calculate_work_rate_compatibility(
        self,
        player1: Dict,
        player2: Dict
    ) -> float:
        """Calculate work rate compatibility."""
        
        wr1 = player1.get('work_rate_defense', 'Medium')
        wr2 = player2.get('work_rate_defense', 'Medium')
        
        if not wr1 or not wr2:
            return 0.7  # Default
        
        score = self.WORK_RATE_COMPATIBILITY.get((wr1, wr2))
        if score is None:
            score = self.WORK_RATE_COMPATIBILITY.get((wr2, wr1), 0.7)
        
        return score
    
    def _calculate_positional_proximity(
        self,
        role1: Optional[str],
        role2: Optional[str]
    ) -> float:
        """Calculate positional proximity score."""
        
        # Simplified position coordinates (y-axis, 0-100)
        position_map = {
            'GK': 5,
            'DEF': 20,
            'MID': 50,
            'FWD': 80
        }
        
        if not role1 or not role2:
            return 0.5
        
        pos1 = position_map.get(role1, 50)
        pos2 = position_map.get(role2, 50)
        
        distance = abs(pos1 - pos2)
        max_distance = 75  # GK to FWD
        
        # Closer = higher score
        proximity = 1 - (distance / max_distance)
        
        return max(0, proximity)
    
    def _calculate_contextual_bonus(
        self,
        player1: Dict,
        player2: Dict
    ) -> float:
        """Calculate enhanced contextual bonuses."""
        
        bonus = 0.0
        
        # Same team (strongest bond)
        if player1.get('team_id') and player2.get('team_id'):
            if player1['team_id'] == player2['team_id']:
                bonus += 0.25
        
        # Same league/competition
        if player1.get('competition_id') and player2.get('competition_id'):
            if player1['competition_id'] == player2['competition_id']:
                bonus += 0.15
        
        # Same nationality bonus (enhanced)
        nationality_bonus = self._calculate_nationality_chemistry(player1, player2)
        bonus += nationality_bonus
        
        # Age compatibility (similar ages work better)
        age1 = player1.get('age_years', 0) or 0
        age2 = player2.get('age_years', 0) or 0
        if age1 > 0 and age2 > 0:
            age_diff = abs(age1 - age2)
            if age_diff <= 2:
                bonus += 0.08  # Very close ages
            elif age_diff <= 5:
                bonus += 0.05  # Similar generation
        
        # Experience level compatibility (similar overall ratings)
        rating1 = player1.get('overall_rating', 0) or 0
        rating2 = player2.get('overall_rating', 0) or 0
        if rating1 > 0 and rating2 > 0:
            rating_diff = abs(rating1 - rating2)
            if rating_diff <= 3:
                bonus += 0.08  # Very similar skill level
            elif rating_diff <= 7:
                bonus += 0.04  # Compatible skill level
        
        # Preferred foot compatibility (different feet can be complementary)
        foot1 = player1.get('preferred_foot', '').lower()
        foot2 = player2.get('preferred_foot', '').lower()
        if foot1 and foot2 and foot1 != foot2:
            # Different preferred feet can be beneficial (left-right balance)
            if foot1 in ['left', 'right'] and foot2 in ['left', 'right']:
                bonus += 0.03
        
        return min(bonus, 0.50)  # Cap at 0.50
    
    def _complementarity_score(
        self,
        value1: float,
        value2: float,
        high_threshold: float,
        low_threshold: float
    ) -> float:
        """
        Calculate complementarity score between two values.
        High complementarity when one is high and other is low.
        """
        
        # Handle None values
        if value1 is None or value2 is None:
            return 0.5  # Neutral score for missing data
        
        is_high_1 = value1 > high_threshold
        is_low_1 = value1 < low_threshold
        is_high_2 = value2 > high_threshold
        is_low_2 = value2 < low_threshold
        
        # Perfect complement: one high, one low
        if (is_high_1 and is_low_2) or (is_low_1 and is_high_2):
            return 1.0
        
        # Good complement: one high, one medium
        if (is_high_1 and not is_high_2 and not is_low_2) or (is_high_2 and not is_high_1 and not is_low_1):
            return 0.8
        
        # Okay: both medium
        if not is_high_1 and not is_low_1 and not is_high_2 and not is_low_2:
            return 0.7
        
        # Similar: both high or both low
        if (is_high_1 and is_high_2) or (is_low_1 and is_low_2):
            return 0.6
        
        return 0.7  # Default
    
    def _safe_divide(self, numerator: float, denominator: float) -> float:
        """Safe division avoiding divide by zero and None values."""
        if numerator is None or denominator is None or denominator == 0:
            return 0.0
        return numerator / denominator
    
    def _estimate_rating(self, player: Dict) -> float:
        """Estimate player rating from stats if not available."""
        
        goals = player.get('goals', 0) or 0
        assists = player.get('assists', 0) or 0
        minutes = player.get('minutes_played', 1) or 1
        
        # Simple estimation
        goals_per_90 = (goals / minutes) * 90
        assists_per_90 = (assists / minutes) * 90
        
        estimated = 50 + (goals_per_90 * 5) + (assists_per_90 * 4)
        
        return min(max(estimated, 40), 95)  # Clamp between 40-95


# Global instance
chemistry_calculator = ChemistryCalculator()
