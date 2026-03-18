# Soccer Chemistry API - Backend

FastAPI backend for calculating player chemistry in soccer. **Now with Supabase integration for seamless deployment!**

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Configure Environment (Optional)

The backend works out-of-the-box with Supabase. For custom configuration:

```bash
cp .env.example .env
# Edit .env if needed
```

### 3. Run the Server

```bash
# Development mode with auto-reload
uvicorn app:app --reload

# Or using Python
python app.py
```

The API will be available at `http://localhost:8000`

## 🌐 Supabase Integration

### Automatic Data Loading
- **No CSV files needed** in your deployment
- Data automatically loaded from Supabase storage on startup
- Fallback to local files for development
- Retry logic with exponential backoff

### Configuration
```bash
# Supabase dataset URL (default works out-of-the-box)
SUPABASE_DATASET_URL=https://iebtpfstqbaqfkrkavgn.supabase.co/storage/v1/object/public/dataset

# Network settings
DATA_DOWNLOAD_TIMEOUT=300
DATA_RETRY_ATTEMPTS=3

# Development fallback
USE_LOCAL_DATA=false
```

## Data Sources

The backend automatically loads from Supabase:
- **713,115 players** with enriched stats and attributes
- **36,634 teams** across global competitions  
- **1,952 competitions** and leagues
- **35 tactical formations**
- Player statistics, contracts, and attributes

##  Testing

Test the Supabase integration:

```bash
python test_supabase_loader.py
```

This will verify:
- ✅ Data loading from Supabase
- ✅ Player search and lookup
- ✅ Formation data
- ✅ Fallback mechanisms

## 📡 API Documentation

Once running, visit:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## 🔗 API Endpoints

### Health & Status
- `GET /api/health` - API health check

### Players
- `GET /api/players` - Search players with filters
- `GET /api/players/{player_id}` - Get player details
- `GET /api/players/formations/all` - Get all formations

### Chemistry
- `POST /api/chemistry/pair` - Calculate pair chemistry
- `POST /api/chemistry/team` - Calculate team chemistry

### Optimizer
- `POST /api/optimize` - Optimize squad selection

## 🚀 Deployment

### Zero-Configuration Deployment
The backend is now **deployment-ready** without any CSV files:

#### Vercel
```bash
# No additional configuration needed
vercel --prod
```

#### Railway
```bash
# Deploy directly from GitHub
# No data files required
```

#### Render
```yaml
# render.yaml
services:
  - type: web
    name: soccer-chemistry-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

#### Docker
```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Environment Variables for Production

Set these in your deployment platform:
```bash
SUPABASE_DATASET_URL=https://iebtpfstqbaqfkrkavgn.supabase.co/storage/v1/object/public/dataset
FRONTEND_URL=https://your-frontend-domain.com
```

## 🏗️ Architecture

### Data Loading Flow
```
Startup → Supabase CSV Download → Data Processing → API Ready
```

### Fallback Strategy
```
Supabase (Primary) → Local Files (Development) → Graceful Error
```

### Performance Features
- **Parallel downloads** for faster startup
- **Retry logic** for network resilience  
- **In-memory caching** for fast API responses
- **Enriched player data** with merged statistics

## 🔧 Development

### Local Development
```bash
# Use Supabase (recommended)
USE_LOCAL_DATA=false

# Or use local files
USE_LOCAL_DATA=true
DATA_PATH=../data
```

### Adding New Endpoints
1. Create route handler in `routes/`
2. Add business logic in `services/`
3. Define schemas in `models/schemas.py`
4. Register router in `app.py`

## 🐛 Troubleshooting

### Data Loading Issues
```bash
# Test Supabase connection
python test_supabase_loader.py

# Check logs for network issues
tail -f logs/app.log
```

### Common Solutions
- **Network timeouts**: Increase `DATA_DOWNLOAD_TIMEOUT`
- **Retry failures**: Increase `DATA_RETRY_ATTEMPTS`  
- **CORS errors**: Update `FRONTEND_URL` in environment

## 📈 Performance

### Startup Times
- **Supabase loading**: ~30-60 seconds (one-time)
- **Local fallback**: ~10-20 seconds
- **API response**: <100ms (cached data)

### Memory Usage
- **Base**: ~200MB
- **With full dataset**: ~800MB-1.2GB
- **Optimized**: Efficient data structures

## 🎯 Benefits

### For Deployment
✅ **No CSV files** in repository  
✅ **Smaller Docker images**  
✅ **Faster deployments**  
✅ **Platform agnostic**  

### For Development  
✅ **Consistent data** across environments  
✅ **Easy data updates** via Supabase  
✅ **Local fallback** for offline work  
✅ **Automatic retries** for reliability  

### For Maintenance
✅ **Centralized data management**  
✅ **Version control** through Supabase  
✅ **No redeployment** for data updates  
✅ **CDN-like performance**  

The backend is now **production-ready** and can be deployed anywhere without data dependencies!
