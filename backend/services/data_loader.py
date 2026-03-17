"""
Data loader service for loading and caching CSV data.
"""
import csv
from pathlib import Path
from typing import Dict, List, Optional
import logging

# Disable pandas to avoid NaN issues
PANDAS_AVAILABLE = False

logger = logging.getLogger(__name__)


class DataLoader:
    """Singleton class for loading and caching soccer data."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(DataLoader, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        # Always allow reinitialization during development
        if not self._initialized or True:  # Force reinit for development
            self.data_path: Optional[Path] = None
            self.players_data: List[Dict] = []
            self.teams_data: List[Dict] = []
            self.competitions_data: List[Dict] = []
            self.seasons_data: List[Dict] = []
            self.player_stats_data: List[Dict] = []
            self.player_attributes_data: List[Dict] = []
            self.player_contracts_data: List[Dict] = []
            self.tactical_schemes_data: List[Dict] = []
            self.team_seasons_data: List[Dict] = []
            
            # Enriched data
            self.players_enriched: List[Dict] = []
            
            # Lookup dictionaries
            self.players_dict: Dict = {}
            self.teams_dict: Dict = {}
            self.competitions_dict: Dict = {}
            
            DataLoader._initialized = True
    
    def _read_csv_file(self, file_path: Path) -> List[Dict]:
        """Read CSV file using Python's built-in csv module."""
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    # Convert empty strings to None for cleaner data
                    cleaned_row = {}
                    for key, value in row.items():
                        if value == '' or value is None:
                            cleaned_row[key] = None
                        else:
                            # Strip whitespace from string values
                            cleaned_row[key] = value.strip() if isinstance(value, str) else value
                    data.append(cleaned_row)
            
            logger.info(f"Successfully read {len(data)} rows from {file_path}")
        except Exception as e:
            logger.error(f"Failed to read {file_path}: {e}")
        
        return data
    
    def load_data(self, data_path: str = "data"):
        """Load all CSV files and create enriched datasets."""
        # Ensure data is available before loading
        from data_manager import data_manager
        
        if not data_manager.ensure_data_available():
            raise Exception("Unable to load required data files")
        
        self.data_path = Path(data_path)
        logger.info(f"Loading data from {self.data_path}")
        
        try:
            # Load core tables
            self.players_data = self._read_csv_file(self.data_path / "players.csv")
            self.teams_data = self._read_csv_file(self.data_path / "teams.csv")
            self.competitions_data = self._read_csv_file(self.data_path / "competitions.csv")
            self.seasons_data = self._read_csv_file(self.data_path / "seasons.csv")
            
            # Load player data
            self.player_stats_data = self._read_csv_file(self.data_path / "player_season_stats_totals.csv")
            self.player_attributes_data = self._read_csv_file(self.data_path / "player_attributes_general.csv")
            self.player_contracts_data = self._read_csv_file(self.data_path / "player_current_contracts.csv")
            
            # Load tactical data
            self.tactical_schemes_data = self._read_csv_file(self.data_path / "tactical_schemes.csv")
            self.team_seasons_data = self._read_csv_file(self.data_path / "team_seasons.csv")
            
            logger.info(f"Loaded {len(self.players_data)} players")
            logger.info(f"Loaded {len(self.teams_data)} teams")
            logger.info(f"Loaded {len(self.competitions_data)} competitions")
            
            # Create enriched player dataset
            self._enrich_player_data()
            
            # Create lookup dictionaries
            self._create_lookups()
            
            logger.info("Data loading completed successfully")
            
        except Exception as e:
            logger.error(f"Error loading data: {e}")
            raise
    
    def _enrich_player_data(self):
        """Merge player data with stats and attributes."""
        logger.info("Enriching player data...")
        
        # Convert string values to appropriate types
        def safe_int(value):
            """Convert value to integer, handling various input types safely."""
            if value is None or value == '':
                return None
            try:
                # Handle string representations of numbers
                if isinstance(value, str):
                    value = value.strip()
                    if value == '' or value.lower() in ('null', 'none', 'nan'):
                        return None
                return int(float(value))
            except (ValueError, TypeError):
                return None
        
        def safe_float(value):
            """Convert value to float, handling various input types safely."""
            if value is None or value == '':
                return 0.0
            try:
                if isinstance(value, str):
                    value = value.strip()
                    if value == '' or value.lower() in ('null', 'none', 'nan'):
                        return 0.0
                return float(value)
            except (ValueError, TypeError):
                return 0.0
        
        # Create lookup dictionaries for faster merging
        contracts_dict = {safe_int(row.get('player_id')): row for row in self.player_contracts_data if row.get('player_id')}
        attributes_dict = {safe_int(row.get('player_id')): row for row in self.player_attributes_data if row.get('player_id')}
        teams_dict = {safe_int(row.get('id')): row for row in self.teams_data if row.get('id')}
        competitions_dict = {safe_int(row.get('id')): row for row in self.competitions_data if row.get('id')}
        
        # Create stats dictionary (include all players, let API endpoint handle filtering)
        stats_dict = {}
        for row in self.player_stats_data:
            player_id = safe_int(row.get('player_id'))
            if player_id:
                if player_id not in stats_dict:
                    stats_dict[player_id] = row
        
        # Enrich each player
        enriched = []
        for player in self.players_data:
            player_id = safe_int(player.get('id'))
            if not player_id:
                continue
                
            enriched_player = player.copy()
            
            # Convert numeric fields from strings to appropriate types
            numeric_fields = ['age_years', 'height_cm', 'weight_kg', 'citizenship_area_id', 'second_citizenship_area_id']
            for field in numeric_fields:
                if field in enriched_player:
                    enriched_player[field] = safe_float(enriched_player[field]) if field == 'age_years' else safe_int(enriched_player[field])
            
            # Add contract info
            if player_id in contracts_dict:
                contract = contracts_dict[player_id]
                enriched_player['current_team_id'] = safe_int(contract.get('team_id'))
            
            # Add attributes
            if player_id in attributes_dict:
                attrs = attributes_dict[player_id]
                enriched_player.update({
                    'overall_rating': safe_int(attrs.get('overall_rating')),
                    'potential_rating': safe_int(attrs.get('potential_rating')),
                    'elo': safe_int(attrs.get('elo')),
                    'preferred_foot': attrs.get('preferred_foot'),
                    'work_rate_attack': attrs.get('work_rate_attack'),
                    'work_rate_defense': attrs.get('work_rate_defense')
                })
            
            # Add stats
            if player_id in stats_dict:
                stats = stats_dict[player_id]
                enriched_player.update({
                    'team_id': safe_int(stats.get('team_id')),
                    'season_id': safe_int(stats.get('season_id')),
                    'competition_id': safe_int(stats.get('competition_id')),
                    'minutes_played': safe_int(stats.get('minutes_played')),
                    'matches': safe_int(stats.get('matches')),
                    'goals': safe_int(stats.get('goals')),
                    'assists': safe_int(stats.get('assists')),
                    'xg_shot': safe_float(stats.get('xg_shot')),
                    'xg_assist': safe_float(stats.get('xg_assist')),
                    'shots': safe_int(stats.get('shots')),
                    'passes': safe_int(stats.get('passes')),
                    'successful_passes': safe_int(stats.get('successful_passes')),
                    'key_passes': safe_int(stats.get('key_passes')),
                    'dribbles': safe_int(stats.get('dribbles')),
                    'successful_dribbles': safe_int(stats.get('successful_dribbles')),
                    'defensive_duels': safe_int(stats.get('defensive_duels')),
                    'defensive_duels_won': safe_int(stats.get('defensive_duels_won')),
                    'interceptions': safe_int(stats.get('interceptions')),
                    'clearances': safe_int(stats.get('clearances')),
                    'recoveries': safe_int(stats.get('recoveries'))
                })
            
            # Add team name
            team_id = enriched_player.get('team_id')
            if team_id and team_id in teams_dict:
                enriched_player['team_name'] = teams_dict[team_id].get('name')
            
            # Add competition name
            comp_id = enriched_player.get('competition_id')
            if comp_id and comp_id in competitions_dict:
                enriched_player['competition_name'] = competitions_dict[comp_id].get('name')
            
            enriched.append(enriched_player)
        
        self.players_enriched = enriched
        logger.info(f"Enriched {len(enriched)} players with stats and attributes")
    
    def _create_lookups(self):
        """Create lookup dictionaries for fast access."""
        # Create lookups with both string and int keys for compatibility
        self.players_dict = {}
        for player in self.players_enriched:
            if player.get('id'):
                # Store with string key
                self.players_dict[str(player['id'])] = player
                # Also store with int key if possible
                try:
                    self.players_dict[int(player['id'])] = player
                except (ValueError, TypeError):
                    pass
        
        self.teams_dict = {team['id']: team for team in self.teams_data if team.get('id')}
        self.competitions_dict = {comp['id']: comp for comp in self.competitions_data if comp.get('id')}
    
    def get_player_by_id(self, player_id: str) -> Optional[Dict]:
        """Get player data by ID."""
        # Try both string and int versions
        player = self.players_dict.get(str(player_id))
        if not player:
            try:
                player = self.players_dict.get(int(player_id))
            except (ValueError, TypeError):
                pass
        return player
    
    def get_players(
        self,
        search: Optional[str] = None,
        team_id: Optional[int] = None,
        competition_id: Optional[int] = None,
        role_code: Optional[str] = None,
        min_minutes: int = 500,
        limit: int = 100
    ) -> List[Dict]:
        """Get filtered list of players."""
        players = self.players_enriched.copy()
        
        # Filter by minimum minutes
        players = [p for p in players if (p.get('minutes_played') or 0) >= min_minutes]
        
        # Filter by search term
        if search:
            search_lower = search.lower()
            players = [p for p in players if 
                      search_lower in str(p.get('short_name', '')).lower() or
                      search_lower in str(p.get('first_name', '')).lower() or
                      search_lower in str(p.get('last_name', '')).lower()]
        
        # Filter by team
        if team_id:
            players = [p for p in players if p.get('team_id') == team_id]
        
        # Filter by competition
        if competition_id:
            players = [p for p in players if p.get('competition_id') == competition_id]
        
        # Filter by role
        if role_code:
            players = [p for p in players if p.get('role_code') == role_code]
        
        # Limit results
        return players[:limit]
    
    def get_team_by_id(self, team_id: int) -> Optional[Dict]:
        """Get team data by ID."""
        return self.teams_dict.get(team_id)
    
    def get_all_teams(self) -> List[Dict]:
        """Get all teams."""
        return self.teams_data
    
    def get_competition_by_id(self, competition_id: int) -> Optional[Dict]:
        """Get competition data by ID."""
        return self.competitions_dict.get(competition_id)
    
    def get_all_competitions(self) -> List[Dict]:
        """Get all competitions."""
        return self.competitions_data
    
    def get_all_formations(self) -> List[Dict]:
        """Get all tactical formations."""
        return self.tactical_schemes_data


# Global instance
data_loader = DataLoader()
