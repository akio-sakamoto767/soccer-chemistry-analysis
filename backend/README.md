# Soccer Chemistry API - Backend

FastAPI backend for calculating player chemistry in soccer.

## Setup

### 1. Create Virtual Environment

```bash
python -m venv venv

# Windows
venv\Scripts\activate

# Mac/Linux
source venv/bin/activate
```

### 2. Install Dependencies

```bash
pip install -r requirements.txt
```

### 3. Configure Environment

Copy `.env.example` to `.env` and update if needed:

```bash
cp .env.example .env
```

### 4. Run the Server

```bash
# Development mode with auto-reload
uvicorn app:app --reload

# Or using Python
python app.py
```

The API will be available at `http://localhost:8000`

## API Documentation

Once the server is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Players
- `GET /api/players` - Get list of players (with filters)
- `GET /api/players/{player_id}` - Get player details
- `GET /api/players/formations/all` - Get all formations

### Chemistry
- `POST /api/chemistry/pair` - Calculate chemistry between two players
- `POST /api/chemistry/team` - Calculate chemistry for a team of 11

### Optimizer
- `POST /api/optimize` - Optimize squad selection

## Testing

Run the test script to verify all endpoints:

```bash
# Make sure server is running first
python test_api.py
```

## Project Structure

```
backend/
├── app.py                 # Main FastAPI application
├── config.py             # Configuration settings
├── routes/               # API route handlers
│   ├── chemistry.py      # Chemistry endpoints
│   ├── players.py        # Player endpoints
│   └── optimizer.py      # Optimization endpoints
├── services/             # Business logic
│   ├── data_loader.py    # Data loading and caching
│   ├── chemistry_calculator.py  # Chemistry algorithm
│   └── squad_optimizer.py       # Squad optimization
├── models/               # Pydantic schemas
│   └── schemas.py        # Request/response models
└── utils/                # Utility functions
```

## Chemistry Algorithm

### Offensive Chemistry
Combines:
- Role compatibility (40%)
- Statistical complementarity (40%)
- Performance alignment (10%)
- Contextual bonuses (10%)

### Defensive Chemistry
Combines:
- Defensive role compatibility (30%)
- Defensive style complementarity (30%)
- Work rate compatibility (20%)
- Positional proximity (10%)
- Contextual bonuses (10%)

## Development

### Adding New Endpoints

1. Create route handler in `routes/`
2. Add business logic in `services/`
3. Define schemas in `models/schemas.py`
4. Register router in `app.py`

### Debugging

Enable debug logging in `app.py`:

```python
logging.basicConfig(level=logging.DEBUG)
```

## Deployment

### Render

1. Create `render.yaml`:
```yaml
services:
  - type: web
    name: soccer-chemistry-api
    env: python
    buildCommand: pip install -r requirements.txt
    startCommand: uvicorn app:app --host 0.0.0.0 --port $PORT
```

2. Push to GitHub and connect to Render

### Environment Variables

Set these in production:
- `FRONTEND_URL` - Your frontend URL for CORS
- `DATA_PATH` - Path to data directory

## Troubleshooting

### Data Loading Errors
- Ensure `data/` directory exists with all CSV files
- Check file paths in `config.py`

### CORS Errors
- Update `ALLOWED_ORIGINS` in `config.py`
- Add your frontend URL

### Performance Issues
- Increase cache TTL in `config.py`
- Consider adding Redis for caching
- Optimize chemistry calculations for large datasets
