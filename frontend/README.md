# Soccer Chemistry Frontend

React frontend for the Soccer Chemistry application.

## Setup

### 1. Install Dependencies

```bash
cd frontend
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Update the API URL if needed:
```
VITE_API_URL=http://localhost:8000/api
```

### 3. Start Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Features

### 1. Pair Chemistry Calculator
- Select any two players
- Calculate offensive and defensive chemistry
- View detailed breakdown of chemistry components
- Visual charts and progress indicators

### 2. Team Network Visualizer (Coming Soon)
- Select 11 players for a team
- Visualize chemistry connections on soccer pitch
- Interactive network diagram
- Formation-based positioning

### 3. Squad Optimizer (Coming Soon)
- Select squad pool (15-25 players)
- Choose formation
- Optimize for maximum/minimum chemistry
- Configurable offensive/defensive weight

## Tech Stack

- **React 18** - UI framework
- **Vite** - Build tool and dev server
- **React Router** - Client-side routing
- **Tailwind CSS** - Styling
- **Recharts** - Data visualization
- **React Select** - Enhanced select components
- **Axios** - HTTP client

## Project Structure

```
frontend/
├── src/
│   ├── components/
│   │   ├── common/           # Shared components
│   │   ├── PairChemistry/    # Pair chemistry feature
│   │   ├── TeamNetwork/      # Team network feature
│   │   └── Optimizer/        # Squad optimizer feature
│   ├── api/                  # API client
│   ├── hooks/                # Custom React hooks
│   ├── utils/                # Utility functions
│   ├── App.jsx               # Main app component
│   └── main.jsx              # Entry point
├── public/                   # Static assets
└── package.json
```

## Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run preview      # Preview production build

# Linting
npm run lint         # Run ESLint
```

## API Integration

The frontend communicates with the FastAPI backend through:

- **Base URL**: `http://localhost:8000/api`
- **Endpoints**:
  - `GET /players` - Search and filter players
  - `POST /chemistry/pair` - Calculate pair chemistry
  - `POST /chemistry/team` - Calculate team chemistry
  - `POST /optimize` - Optimize squad selection

## Styling

Uses Tailwind CSS with custom components:

- **Colors**: Primary green theme matching soccer
- **Components**: Reusable button, card, and chemistry styling
- **Responsive**: Mobile-first design
- **Animations**: Smooth transitions and loading states

## Development

### Adding New Components

1. Create component in appropriate feature folder
2. Export from feature's index file
3. Add route in `App.jsx` if needed
4. Update navigation in `Navbar.jsx`

### API Calls

Use the `apiClient` from `src/api/client.js`:

```javascript
import { apiClient } from '../api/client'

const response = await apiClient.getPlayers({ search: 'messi' })
```

### Styling Guidelines

- Use Tailwind utility classes
- Follow existing color scheme (primary green)
- Use custom component classes for consistency
- Ensure mobile responsiveness

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Connect repository to Vercel
3. Set environment variables:
   - `VITE_API_URL=https://your-backend-url.com/api`
4. Deploy

### Build for Production

```bash
npm run build
```

Output will be in `dist/` directory.

## Troubleshooting

### API Connection Issues
- Ensure backend is running on `http://localhost:8000`
- Check CORS configuration in backend
- Verify API URL in `.env` file

### Build Errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors
- Ensure all imports are correct

### Styling Issues
- Rebuild Tailwind: `npm run build`
- Check for conflicting CSS classes
- Verify Tailwind configuration