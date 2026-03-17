# 🚂 Railway Backend Deployment Guide

## Step-by-Step Instructions

### 1. Sign Up for Railway
- Go to [railway.app](https://railway.app)
- Click "Login" and sign up with GitHub
- Connect your GitHub account

### 2. Create New Project
- Click "New Project"
- Select "Deploy from GitHub repo"
- Choose your repository: `soccer-chemistry-analysis`

### 3. Configure Deployment
- **Root Directory**: Set to `backend` (important!)
- **Build Command**: Will auto-detect from Procfile
- **Start Command**: Will use: `gunicorn flask_app:app --bind 0.0.0.0:$PORT`

### 4. Set Environment Variables
In Railway dashboard, add these variables:
```
FLASK_ENV=production
PORT=8000
```

### 5. Deploy
- Click "Deploy"
- Railway will automatically build and deploy
- Wait for deployment to complete (2-3 minutes)

### 6. Get Your URL
- Once deployed, you'll get a URL like: `https://your-app-name.railway.app`
- Test it by visiting: `https://your-app-name.railway.app/api/health`

## Files Already Configured ✅

- `Procfile` - Tells Railway how to start the app
- `railway.json` - Railway-specific configuration
- `requirements.txt` - Python dependencies (Flask, CORS, Gunicorn)

## After Deployment

### Update Frontend
1. Go to your Vercel dashboard
2. Update environment variable:
   ```
   VITE_API_URL=https://your-railway-app.railway.app/api
   ```
3. Redeploy frontend (automatic)

### Test Everything
- Backend health: `https://your-railway-app.railway.app/api/health`
- Frontend: `https://frontend-alpha-weld-87.vercel.app`

## Troubleshooting

### If deployment fails:
1. Check Railway logs in dashboard
2. Ensure `backend` is set as root directory
3. Verify all files are committed to GitHub

### Common issues:
- **Port binding**: App uses `$PORT` environment variable ✅
- **Dependencies**: All listed in requirements.txt ✅
- **Start command**: Configured in Procfile ✅

## Cost
- **Free tier**: 500 hours/month (enough for testing)
- **Pro plan**: $5/month for unlimited usage

Railway is perfect for this Flask backend! 🎉