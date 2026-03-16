# Player Chemistry Web App

A web application that calculates and visualizes chemistry between soccer players based on statistical complementarity and contextual factors.

## Project Overview

This project implements a player chemistry algorithm inspired by the paper "Player Chemistry: Striving for a Perfectly Balanced Soccer Team" by Bransen & Van Haaren (SSAC 2020).

## Features

1. **Pair Chemistry Calculator** - Calculate offensive and defensive chemistry between any two players
2. **Team Chemistry Network** - Visualize chemistry connections for an 11-player lineup on a soccer pitch
3. **Squad Optimizer** - Automatically select the optimal starting XI from a squad pool

## Tech Stack

### Backend
- FastAPI (Python)
- Pandas & NumPy for data processing
- Uvicorn ASGI server

### Frontend
- React.js with Vite
- Axios for API calls
- Recharts for visualizations
- Tailwind CSS for styling

## Project Structure

```
soccer-chemistry/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
├── data/            # CSV datasets
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.9+
- Node.js 18+
- npm or yarn

### Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app:app --reload
```

### Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

## Methodology

### Chemistry Calculation

The chemistry algorithm considers:

**Offensive Chemistry:**
- Role compatibility (striker + attacking midfielder = high synergy)
- Statistical complementarity (finisher + creator = strong partnership)
- Performance alignment (similar quality players gel better)
- Contextual bonuses (same team, league, nationality)

**Defensive Chemistry:**
- Defensive role compatibility
- Defensive style complementarity (ball-winner + interceptor)
- Work rate compatibility
- Positional proximity
- Contextual bonuses

### Differences from Paper

Due to data limitations, this implementation differs from the original paper:
- Uses season-aggregated statistics instead of match-level event data
- No VAEP framework (uses xG/xGA and statistical proxies)
- No co-presence tracking (inferred from contextual data)
- Formula-based approach rather than machine learning

These choices were made pragmatically based on available data while maintaining the core concept of measuring player complementarity.

## Data Sources

Dataset provided by SoccerSolver containing:
- 713,115 players
- 36,634 teams
- 1,952 competitions
- 16,766 seasons
- Player statistics, attributes, and contracts

## License

This project is created as a technical challenge for SoccerSolver.

## Author

[Your Name]

## Acknowledgments

- Paper: "Player Chemistry: Striving for a Perfectly Balanced Soccer Team" by Lotte Bransen and Jan Van Haaren
- Dataset: SoccerSolver
