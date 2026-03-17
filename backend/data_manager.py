"""
Data Manager for handling external datasets in production.
Supports local files, cloud storage, and automatic fallbacks.
"""
import os
import logging
from pathlib import Path
from typing import List, Optional

logger = logging.getLogger(__name__)

class DataManager:
    """Manages data loading from various sources."""
    
    def __init__(self):
        self.data_path = Path("data")
        self.required_files = [
            'players.csv',
            'teams.csv', 
            'competitions.csv',
            'seasons.csv',
            'player_season_stats_totals.csv',
            'player_attributes_general.csv',
            'player_current_contracts.csv',
            'tactical_schemes.csv',
            'team_seasons.csv',
            'areas.csv',
            'player_season_stats_avgs.csv',
            'player_season_stats_percents.csv'
        ]
    
    def ensure_data_available(self) -> bool:
        """Ensure all required data files are available."""
        try:
            # Check if data exists locally
            if self._check_local_data():
                logger.info("✅ All data files found locally")
                return True
            
            # Try to download from cloud storage
            if self._download_from_cloud():
                logger.info("✅ Data downloaded from cloud storage")
                return True
            
            # Fallback: try to use bundled data
            if self._check_bundled_data():
                logger.info("✅ Using bundled data files")
                return True
            
            logger.error("❌ No data source available")
            return False
            
        except Exception as e:
            logger.error(f"Error ensuring data availability: {e}")
            return False
    
    def _check_local_data(self) -> bool:
        """Check if all required files exist locally."""
        if not self.data_path.exists():
            return False
        
        for file in self.required_files:
            if not (self.data_path / file).exists():
                logger.warning(f"Missing local file: {file}")
                return False
        
        return True
    
    def _download_from_cloud(self) -> bool:
        """Download data from cloud storage (S3, GCS, etc.)."""
        try:
            # AWS S3
            if self._download_from_s3():
                return True
            
            # Google Cloud Storage
            if self._download_from_gcs():
                return True
            
            # Generic HTTP download
            if self._download_from_http():
                return True
            
            return False
            
        except Exception as e:
            logger.error(f"Cloud download failed: {e}")
            return False
    
    def _download_from_s3(self) -> bool:
        """Download from AWS S3."""
        try:
            import boto3
            
            # Check for AWS credentials
            access_key = os.environ.get('AWS_ACCESS_KEY_ID')
            secret_key = os.environ.get('AWS_SECRET_ACCESS_KEY')
            bucket_name = os.environ.get('S3_BUCKET_NAME')
            
            if not all([access_key, secret_key, bucket_name]):
                logger.info("AWS S3 credentials not found, skipping...")
                return False
            
            logger.info("Downloading data from AWS S3...")
            
            s3 = boto3.client(
                's3',
                aws_access_key_id=access_key,
                aws_secret_access_key=secret_key
            )
            
            # Create data directory
            self.data_path.mkdir(exist_ok=True)
            
            # Download each file
            for file in self.required_files:
                s3_key = f"soccer-data/{file}"
                local_path = self.data_path / file
                
                s3.download_file(bucket_name, s3_key, str(local_path))
                logger.info(f"Downloaded {file} from S3")
            
            return True
            
        except ImportError:
            logger.warning("boto3 not installed, skipping S3 download")
            return False
        except Exception as e:
            logger.error(f"S3 download failed: {e}")
            return False
    
    def _download_from_gcs(self) -> bool:
        """Download from Google Cloud Storage."""
        try:
            from google.cloud import storage
            
            bucket_name = os.environ.get('GCS_BUCKET_NAME')
            if not bucket_name:
                logger.info("GCS bucket not configured, skipping...")
                return False
            
            logger.info("Downloading data from Google Cloud Storage...")
            
            client = storage.Client()
            bucket = client.bucket(bucket_name)
            
            # Create data directory
            self.data_path.mkdir(exist_ok=True)
            
            # Download each file
            for file in self.required_files:
                blob = bucket.blob(f"soccer-data/{file}")
                local_path = self.data_path / file
                
                blob.download_to_filename(str(local_path))
                logger.info(f"Downloaded {file} from GCS")
            
            return True
            
        except ImportError:
            logger.warning("google-cloud-storage not installed, skipping GCS download")
            return False
        except Exception as e:
            logger.error(f"GCS download failed: {e}")
            return False
    
    def _download_from_http(self) -> bool:
        """Download from HTTP/CDN."""
        try:
            import requests
            
            base_url = os.environ.get('DATA_CDN_URL')
            if not base_url:
                logger.info("CDN URL not configured, skipping...")
                return False
            
            logger.info("Downloading data from CDN...")
            
            # Create data directory
            self.data_path.mkdir(exist_ok=True)
            
            # Download each file
            for file in self.required_files:
                url = f"{base_url.rstrip('/')}/{file}"
                local_path = self.data_path / file
                
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                
                with open(local_path, 'wb') as f:
                    f.write(response.content)
                
                logger.info(f"Downloaded {file} from CDN")
            
            return True
            
        except ImportError:
            logger.warning("requests not installed, skipping HTTP download")
            return False
        except Exception as e:
            logger.error(f"HTTP download failed: {e}")
            return False
    
    def _check_bundled_data(self) -> bool:
        """Check if data is bundled with the application."""
        # This would be used if you include data in the Docker image
        # or as part of the application bundle
        bundled_path = Path("bundled_data")
        
        if not bundled_path.exists():
            return False
        
        # Copy bundled data to working directory
        import shutil
        
        self.data_path.mkdir(exist_ok=True)
        
        for file in self.required_files:
            src = bundled_path / file
            dst = self.data_path / file
            
            if src.exists():
                shutil.copy2(src, dst)
                logger.info(f"Copied bundled file: {file}")
            else:
                logger.warning(f"Missing bundled file: {file}")
                return False
        
        return True
    
    def get_data_info(self) -> dict:
        """Get information about current data state."""
        info = {
            "data_path": str(self.data_path),
            "files_required": len(self.required_files),
            "files_present": 0,
            "files_missing": [],
            "total_size_mb": 0
        }
        
        if self.data_path.exists():
            for file in self.required_files:
                file_path = self.data_path / file
                if file_path.exists():
                    info["files_present"] += 1
                    info["total_size_mb"] += file_path.stat().st_size / (1024 * 1024)
                else:
                    info["files_missing"].append(file)
        else:
            info["files_missing"] = self.required_files.copy()
        
        info["total_size_mb"] = round(info["total_size_mb"], 2)
        info["is_complete"] = len(info["files_missing"]) == 0
        
        return info

# Global instance
data_manager = DataManager()