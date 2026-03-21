"""
Supabase-enabled data loader service for loading CSV data from remote URLs.
"""
import csv
import io
import time
from pathlib import Path
from typing import Dict, List, Optional
import logging
import requests
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry

from config import (
    SUPABASE_DATASET_URL, 
    DATA_DOWNLOAD_TIMEOUT, 
    DATA_RETRY_ATTEMPTS,
    USE_LOCAL_DATA,
    DATA_PATH
)

logger = logging.getLogger(__name__)


class SupabaseDataLoader:
    """Singleton class for loading soccer data from Supabase storage."""
    
    _instance = None
    _initialized = False
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(SupabaseDataLoader, cls).__new__(cls)
        return cls._instance
    
    def __init__(self):
        if not self._initialized:
            # Data storage
            self.players_data: List[Dict] = []
            self.teams_data: List[Dict] = []
            self.competitions_data: List[Dict] = []
            self.seasons_data: List[Dict] = []
            self.player_stats_data: List[Dict] = []
            self.player_attributes_data: List[Dict] = []
            self.player_contracts_data: List[Dict] = []
            self.tactical_schemes_data: List[Dict] = []
            self.team_seasons_data: List[Dict] = []
            self.areas_data: List[Dict] = []
            
            # Enriched data
            self.players_enriched: List[Dict] = []
            
            # Lookup dictionaries
            self.players_dict: Dict = {}
            self.teams_dict: Dict = {}
            self.competitions_dict: Dict = {}
            
            # HTTP session with retry strategy
            self.session = self._create_http_session()
            
            # Required CSV files
            self.required_files = [
                "players.csv",
                "teams.csv", 
                "competitions.csv",
                "seasons.csv",
                "player_season_stats_totals.csv",
                "player_attributes_general.csv",
                "player_current_contracts.csv",
                "tactical_schemes.csv",
                "team_seasons.csv",
                "areas.csv"
            ]
            
            SupabaseDataLoader._initialized = True
    
    def _create_http_session(self) -> requests.Session:
        """Create HTTP session with retry strategy."""
        session = requests.Session()
        
        # Configure retry strategy
        retry_strategy = Retry(
            total=DATA_RETRY_ATTEMPTS,
            backoff_factor=1,
            status_forcelist=[429, 500, 502, 503, 504],
            allowed_methods=["HEAD", "GET", "OPTIONS"]
        )
        
        adapter = HTTPAdapter(max_retries=retry_strategy)
        session.mount("http://", adapter)
        session.mount("https://", adapter)
        
        # Set timeout
        session.timeout = DATA_DOWNLOAD_TIMEOUT
        
        return session
    
    def _download_csv_from_supabase(self, filename: str) -> List[Dict]:
        """Download and parse CSV file from Supabase storage."""
        url = f"{SUPABASE_DATASET_URL}/{filename}"
        
        logger.info(f"Downloading {filename} from Supabase...")
        start_time = time.time()
        
        try:
            response = self.session.get(url, timeout=DATA_DOWNLOAD_TIMEOUT)
            response.raise_for_status()
            
            # Parse CSV content
            csv_content = response.text
            data = self._parse_csv_content(csv_content, filename)
            
            download_time = time.time() - start_time
            logger.info(f"Successfully downloaded {filename}: {len(data)} rows in {download_time:.2f}s")
            
            return data
            
        except requests.exceptions.RequestException as e:
            logger.error(f"Failed to download {filename} from {url}: {e}")
            raise
        except Exception as e:
            logger.error(f"Error processing {filename}: {e}")
            raise
    
    def _read_local_csv_file(self, file_path: Path) -> List[Dict]:
        """Read CSV file from local filesystem (fallback)."""
        data = []
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    cleaned_row = {}
                    for key, value in row.items():
                        if value == '' or value is None:
                            cleaned_row[key] = None
                        else:
                            cleaned_row[key] = value.strip() if isinstance(value, str) else value
                    data.append(cleaned_row)
            
            logger.info(f"Successfully read {len(data)} rows from {file_path}")
        except Exception as e:
            logger.error(f"Failed to read {file_path}: {e}")
            raise
        
        return data
    
    def _parse_csv_content(self, csv_content: str, filename: str) -> List[Dict]:
        """Parse CSV content string into list of dictionaries."""
        data = []
        try:
            # Use StringIO to treat string as file-like object
            csv_file = io.StringIO(csv_content)
            reader = csv.DictReader(csv_file)
            
            for row in reader:
                # Clean and process row data
                cleaned_row = {}
                for key, value in row.items():
                    if value == '' or value is None:
                        cleaned_row[key] = None
                    else:
                        # Strip whitespace and handle special values
                        if isinstance(value, str):
                            value = value.strip()
                            if value.lower() in ('null', 'none', 'nan', ''):
                                value = None
                        cleaned_row[key] = value
                data.append(cleaned_row)
            
        except Exception as e:
            logger.error(f"Error parsing CSV content for {filename}: {e}")
            raise
        
        return data
    
    def load_data(self, use_local: bool = None) -> None:
        """Load all CSV files from Supabase or local fallback."""
        if use_local is None:
            use_local = USE_LOCAL_DATA
        
        logger.info("Starting data loading process...")
        start_time = time.time()
        
        try:
            if use_local:
                logger.info("Using local data files...")
                self._load_local_data()
            else:
                logger.info("Loading data from Supabase...")
                self._load_supabase_data()
            
            # Enrich player data
            self._enrich_player_data()
            
            # Create lookup dictionaries
            self._create_lookups()
            
            total_time = time.time() - start_time
            logger.info(f"Data loading completed successfully in {total_time:.2f}s")
            
        except Exception as e:
            logger.error(f"Data loading failed: {e}")
            # Try fallback if Supabase fails
            if not use_local:
                logger.info("Attempting fallback to local data...")
                try:
                    self._load_local_data()
                    self._enrich_player_data()
                    self._create_lookups()
                    logger.info("Fallback to local data successful")
                except Exception as fallback_error:
                    logger.error(f"Fallback also failed: {fallback_error}")
                    raise e
            else:
                raise
    
    def _load_supabase_data(self) -> None:
        """Load all CSV files from Supabase storage."""
        # Load core tables
        self.players_data = self._download_csv_from_supabase("players.csv")
        self.teams_data = self._download_csv_from_supabase("teams.csv")
        self.competitions_data = self._download_csv_from_supabase("competitions.csv")
        self.seasons_data = self._download_csv_from_supabase("seasons.csv")
        self.areas_data = self._download_csv_from_supabase("areas.csv")
        
        # Load player data
        self.player_stats_data = self._download_csv_from_supabase("player_season_stats_totals.csv")
        self.player_attributes_data = self._download_csv_from_supabase("player_attributes_general.csv")
        self.player_contracts_data = self._download_csv_from_supabase("player_current_contracts.csv")
        
        # Load tactical data
        self.tactical_schemes_data = self._download_csv_from_supabase("tactical_schemes.csv")
        self.team_seasons_data = self._download_csv_from_supabase("team_seasons.csv")
        
        logger.info(f"Loaded from Supabase: {len(self.players_data)} players, "
                   f"{len(self.teams_data)} teams, {len(self.competitions_data)} competitions")
    
    def _load_local_data(self) -> None:
        """Load all CSV files from local filesystem."""
        data_path = Path(DATA_PATH)
        
        logger.info(f"=" * 60)
        logger.info(f"Loading data from local path: {data_path.absolute()}")
        logger.info(f"Path exists: {data_path.exists()}")
        logger.info(f"=" * 60)
        
        if not data_path.exists():
            raise FileNotFoundError(f"Data path does not exist: {data_path.absolute()}")
        
        # Load core tables
        self.players_data = self._read_local_csv_file(data_path / "players.csv")
        logger.info(f"✅ Loaded {len(self.players_data):,} players from CSV")
        
        self.teams_data = self._read_local_csv_file(data_path / "teams.csv")
        logger.info(f"✅ Loaded {len(self.teams_data):,} teams")
        
        self.competitions_data = self._read_local_csv_file(data_path / "competitions.csv")
        logger.info(f"✅ Loaded {len(self.competitions_data):,} competitions")
        
        self.seasons_data = self._read_local_csv_file(data_path / "seasons.csv")
        logger.info(f"✅ Loaded {len(self.seasons_data):,} seasons")
        
        self.areas_data = self._read_local_csv_file(data_path / "areas.csv")
        logger.info(f"✅ Loaded {len(self.areas_data):,} areas")
        
        # Load player data
        self.player_stats_data = self._read_local_csv_file(data_path / "player_season_stats_totals.csv")
        logger.info(f"✅ Loaded {len(self.player_stats_data):,} player stats")
        
        self.player_attributes_data = self._read_local_csv_file(data_path / "player_attributes_general.csv")
        logger.info(f"✅ Loaded {len(self.player_attributes_data):,} player attributes")
        
        self.player_contracts_data = self._read_local_csv_file(data_path / "player_current_contracts.csv")
        logger.info(f"✅ Loaded {len(self.player_contracts_data):,} player contracts")
        
        # Load tactical data
        self.tactical_schemes_data = self._read_local_csv_file(data_path / "tactical_schemes.csv")
        logger.info(f"✅ Loaded {len(self.tactical_schemes_data):,} tactical schemes")
        
        self.team_seasons_data = self._read_local_csv_file(data_path / "team_seasons.csv")
        logger.info(f"✅ Loaded {len(self.team_seasons_data):,} team seasons")
        
        logger.info(f"=" * 60)
        logger.info(f"📊 Total: {len(self.players_data):,} players, {len(self.teams_data):,} teams, {len(self.competitions_data):,} competitions")
        logger.info(f"=" * 60)
        
        # Load tactical data
        self.tactical_schemes_data = self._read_local_csv_file(data_path / "tactical_schemes.csv")
        self.team_seasons_data = self._read_local_csv_file(data_path / "team_seasons.csv")
        
        logger.info(f"Loaded locally: {len(self.players_data)} players, "
                   f"{len(self.teams_data)} teams, {len(self.competitions_data)} competitions")
    
    def _enrich_player_data(self):
        """Merge player data with stats and attributes."""
        logger.info("Enriching player data...")
        
        # Convert string values to appropriate types
        def safe_int(value):
            """Convert value to integer, handling various input types safely."""
            if value is None or value == '':
                return None
            try:
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
        
        # Create stats lookup - group by player_id and get latest season
        stats_dict = {}
        for row in self.player_stats_data:
            player_id = safe_int(row.get('player_id'))
            season_id = safe_int(row.get('season_id'))
            
            if player_id and season_id:
                current_season_id = safe_int(stats_dict.get(player_id, {}).get('season_id', 0))
                if player_id not in stats_dict or season_id > current_season_id:
                    stats_dict[player_id] = row
        
        # Create team lookup for team names
        teams_lookup = {safe_int(team.get('id')): team for team in self.teams_data if team.get('id')}
        
        # Enrich each player
        enriched_players = []
        for player in self.players_data:
            try:
                player_id = safe_int(player.get('id'))
                if not player_id:
                    continue
                
                # Start with base player data
                enriched_player = dict(player)
                
                # Add contract data
                if player_id in contracts_dict:
                    contract = contracts_dict[player_id]
                    for key, value in contract.items():
                        if key != 'player_id':  # Avoid duplicate
                            enriched_player[f'contract_{key}'] = value
                
                # Add attributes data
                if player_id in attributes_dict:
                    attributes = attributes_dict[player_id]
                    for key, value in attributes.items():
                        if key != 'player_id':  # Avoid duplicate
                            enriched_player[f'attr_{key}'] = value
                
                # Add latest stats
                if player_id in stats_dict:
                    stats = stats_dict[player_id]
                    for key, value in stats.items():
                        if key not in ['player_id', 'season_id']:  # Avoid duplicates
                            enriched_player[f'stats_{key}'] = value
                
                # Add team name if available
                team_id = safe_int(player.get('team_id'))
                if team_id and team_id in teams_lookup:
                    enriched_player['team_name'] = teams_lookup[team_id].get('team_name', '')
                
                # Map attr_overall_rating to overall_rating for easier access
                if 'attr_overall_rating' in enriched_player and 'overall_rating' not in enriched_player:
                    enriched_player['overall_rating'] = enriched_player['attr_overall_rating']
                
                # Map attr_work_rate fields for easier access
                if 'attr_work_rate_attack' in enriched_player:
                    enriched_player['work_rate_attack'] = enriched_player['attr_work_rate_attack']
                if 'attr_work_rate_defense' in enriched_player:
                    enriched_player['work_rate_defense'] = enriched_player['attr_work_rate_defense']
                
                # Convert numeric fields
                for field in ['overall_rating', 'potential', 'value_eur', 'wage_eur', 'age', 'height_cm', 'weight_kg']:
                    if field in enriched_player:
                        enriched_player[field] = safe_float(enriched_player[field])
                
                # Ensure required fields exist
                enriched_player['short_name'] = enriched_player.get('short_name') or enriched_player.get('player_name', 'Unknown')
                enriched_player['role_name'] = enriched_player.get('role_name', 'Unknown')
                enriched_player['role_code'] = enriched_player.get('role_code', 'UNK')
                
                enriched_players.append(enriched_player)
                
            except Exception as e:
                logger.warning(f"Error enriching player {player.get('id', 'unknown')}: {e}")
                continue
        
        self.players_enriched = enriched_players
        logger.info(f"=" * 60)
        logger.info(f"✅ Successfully enriched {len(self.players_enriched):,} players out of {len(self.players_data):,} total")
        if len(self.players_data) > 0:
            logger.info(f"   Enrichment rate: {(len(self.players_enriched)/len(self.players_data)*100):.1f}%")
        logger.info(f"=" * 60)
    
    def _create_lookups(self):
        """Create lookup dictionaries for fast access."""
        logger.info("Creating lookup dictionaries...")
        
        def safe_int(value):
            try:
                return int(float(value)) if value is not None and value != '' else None
            except (ValueError, TypeError):
                return None
        
        # Create player lookup
        self.players_dict = {}
        for player in self.players_enriched:
            player_id = safe_int(player.get('id'))
            if player_id:
                self.players_dict[str(player_id)] = player
        
        # Create team lookup
        self.teams_dict = {}
        for team in self.teams_data:
            team_id = safe_int(team.get('id'))
            if team_id:
                self.teams_dict[team_id] = team
        
        # Create competition lookup
        self.competitions_dict = {}
        for competition in self.competitions_data:
            comp_id = safe_int(competition.get('id'))
            if comp_id:
                self.competitions_dict[comp_id] = competition
        
        logger.info(f"Created lookups: {len(self.players_dict)} players, "
                   f"{len(self.teams_dict)} teams, {len(self.competitions_dict)} competitions")
    
    def get_player_by_id(self, player_id: str) -> Optional[Dict]:
        """Get player by ID."""
        return self.players_dict.get(str(player_id))
    
    def get_players(
        self,
        search: str = "",
        team_id: Optional[int] = None,
        competition_id: Optional[int] = None,
        role_name: Optional[str] = None,
        role_code: Optional[str] = None,  # Add role_code parameter
        min_minutes: int = 500,  # Add min_minutes parameter
        limit: int = 50,
        offset: int = 0
    ) -> Dict:
        """Get players with optional filtering."""
        # Lazy loading: try to load data if not already loaded
        if not self.players_enriched:
            logger.info("Data not loaded, attempting lazy loading...")
            try:
                self.load_data()
            except Exception as e:
                logger.error(f"Lazy loading failed: {e}")
                return {
                    "players": [],
                    "total": 0,
                    "limit": limit,
                    "offset": offset,
                    "error": "Data not available - Supabase connection failed"
                }
        
        filtered_players = self.players_enriched
        
        # Apply search filter
        if search:
            search_lower = search.lower()
            filtered_players = [
                p for p in filtered_players
                if (search_lower in (p.get('short_name') or '').lower() or
                    search_lower in (p.get('first_name') or '').lower() or
                    search_lower in (p.get('last_name') or '').lower() or
                    search_lower in (p.get('player_name') or '').lower())
            ]
        
        # Apply team filter
        if team_id:
            filtered_players = [p for p in filtered_players if str(p.get('team_id')) == str(team_id)]
        
        # Apply competition filter
        if competition_id:
            filtered_players = [p for p in filtered_players if str(p.get('competition_id')) == str(competition_id)]
        
        # Apply role filter
        if role_name:
            filtered_players = [p for p in filtered_players if p.get('role_name') == role_name]
        
        # Apply role code filter
        if role_code:
            filtered_players = [p for p in filtered_players if p.get('role_code') == role_code]
        
        # Apply minimum minutes filter
        if min_minutes > 0:
            filtered_players = [p for p in filtered_players if (p.get('stats_minutes_played') or 0) >= min_minutes]
        
        # Apply pagination
        total = len(filtered_players)
        players = filtered_players[offset:offset + limit]
        
        return {
            "players": players,
            "total": total,
            "limit": limit,
            "offset": offset
        }
    
    def get_team_by_id(self, team_id: int) -> Optional[Dict]:
        """Get team by ID."""
        return self.teams_dict.get(team_id)
    
    def get_all_teams(self) -> List[Dict]:
        """Get all teams."""
        return self.teams_data
    
    def get_competition_by_id(self, competition_id: int) -> Optional[Dict]:
        """Get competition by ID."""
        return self.competitions_dict.get(competition_id)
    
    def get_all_competitions(self) -> List[Dict]:
        """Get all competitions."""
        return self.competitions_data
    
    def get_all_formations(self) -> List[Dict]:
        """Get all tactical formations."""
        formations = []
        for scheme in self.tactical_schemes_data:
            try:
                formation = {
                    'id': scheme.get('id'),
                    'name': scheme.get('name', 'Unknown Formation'),
                    'formation': scheme.get('formation', '4-4-2'),
                    'positions': scheme.get('positions', '{}')
                }
                formations.append(formation)
            except Exception as e:
                logger.warning(f"Error processing formation {scheme.get('id', 'unknown')}: {e}")
        
        return formations


# Create singleton instance
data_loader = SupabaseDataLoader()