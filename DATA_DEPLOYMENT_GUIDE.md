# 📊 External Dataset Deployment Guide

## Current Situation
- **Data Size**: ~245MB of CSV files
- **Files**: 12 CSV files (players, teams, stats, etc.)
- **Location**: `/data` folder
- **Usage**: Loaded into memory on app startup

## 🚀 Deployment Options

### Option 1: Include Data in Repository (Simplest)
**Best for**: Small datasets, quick deployment

```bash
# Keep data in repository
git add data/
git commit -m "Add dataset files"
git push
```

**Pros**: 
- Simple deployment
- No external dependencies
- Fast local access

**Cons**: 
- Large repository size
- Git performance issues
- 245MB might hit some platform limits

---

### Option 2: Cloud Storage + Download on Startup (Recommended)
**Best for**: Production deployments

#### Setup Cloud Storage:

**AWS S3 (Recommended)**
```python
# Add to requirements.txt
boto3==1.34.0

# Update data_loader.py
import boto3
import os
from pathlib import Path

def download_data_from_s3():
    s3 = boto3.client('s3')
    bucket = 'your-soccer-data-bucket'
    
    data_files = [
        'players.csv', 'teams.csv', 'competitions.csv',
        'player_season_stats_totals.csv', 'player_attributes_general.csv',
        # ... other files
    ]
    
    os.makedirs('data', exist_ok=True)
    
    for file in data_files:
        s3.download_file(bucket, file, f'data/{file}')
        print(f"Downloaded {file}")
```

**Google Cloud Storage**
```python
# Add to requirements.txt
google-cloud-storage==2.10.0

from google.cloud import storage

def download_data_from_gcs():
    client = storage.Client()
    bucket = client.bucket('your-soccer-data-bucket')
    
    for file in data_files:
        blob = bucket.blob(file)
        blob.download_to_filename(f'data/{file}')
```

---

### Option 3: Database Migration (Best for Scale)
**Best for**: Large datasets, multiple environments

#### PostgreSQL Setup:
```python
# Add to requirements.txt
psycopg2-binary==2.9.7
sqlalchemy==2.0.23

# Create database loader
import pandas as pd
from sqlalchemy import create_engine

def migrate_to_database():
    engine = create_engine(os.environ['DATABASE_URL'])
    
    # Load and insert each CSV
    for file in csv_files:
        df = pd.read_csv(f'data/{file}')
        table_name = file.replace('.csv', '')
        df.to_sql(table_name, engine, if_exists='replace', index=False)
```

---

### Option 4: CDN Hosting (Fast Global Access)
**Best for**: Public datasets, global users

Upload to CDN and download:
```python
import requests

def download_from_cdn():
    base_url = "https://cdn.yoursite.com/data/"
    
    for file in data_files:
        response = requests.get(f"{base_url}{file}")
        with open(f"data/{file}", 'wb') as f:
            f.write(response.content)
```

---

## 🛠️ Implementation for Railway

### Recommended Approach: Cloud Storage

1. **Upload data to AWS S3**:
```bash
aws s3 cp data/ s3://your-bucket/soccer-data/ --recursive
```

2. **Update data_loader.py**:
```python
def ensure_data_exists(self):
    """Download data if not present locally."""
    if not os.path.exists('data/players.csv'):
        print("Data not found locally, downloading...")
        self.download_data_from_cloud()
    
def download_data_from_cloud(self):
    """Download data from cloud storage."""
    import boto3
    
    s3 = boto3.client(
        's3',
        aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
        aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY')
    )
    
    bucket = os.environ.get('S3_BUCKET_NAME', 'your-soccer-data')
    
    data_files = [
        'players.csv', 'teams.csv', 'competitions.csv',
        'player_season_stats_totals.csv', 'player_attributes_general.csv',
        'player_current_contracts.csv', 'tactical_schemes.csv',
        'team_seasons.csv', 'seasons.csv', 'areas.csv',
        'player_season_stats_avgs.csv', 'player_season_stats_percents.csv'
    ]
    
    os.makedirs('data', exist_ok=True)
    
    for file in data_files:
        try:
            s3.download_file(bucket, f'soccer-data/{file}', f'data/{file}')
            print(f"✅ Downloaded {file}")
        except Exception as e:
            print(f"❌ Failed to download {file}: {e}")
            raise

def load_data(self, data_path: str = "data"):
    """Load data, downloading if necessary."""
    self.ensure_data_exists()  # Add this line
    # ... rest of existing code
```

3. **Add environment variables to Railway**:
```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
S3_BUCKET_NAME=your-bucket-name
```

4. **Update requirements.txt**:
```
flask==3.0.0
flask-cors==4.0.0
python-dotenv==1.0.0
gunicorn==21.2.0
boto3==1.34.0
```

---

## 🎯 Quick Implementation

For immediate deployment, I recommend **Option 1** (include in repo) for now, then migrate to **Option 2** (cloud storage) for production.

### Immediate Steps:
1. Keep data in repository for first deployment
2. Test deployment works
3. Then migrate to cloud storage

### Production Steps:
1. Upload data to S3/GCS
2. Update data_loader.py with download logic
3. Add cloud credentials to Railway
4. Remove data from repository

This approach gives you a working deployment quickly while setting up for proper production scaling.