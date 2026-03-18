@echo off
echo Deploying Soccer Chemistry Backend to Railway...
echo.

REM Check if railway CLI is installed
railway --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Railway CLI not found. Installing...
    npm install -g @railway/cli
    echo.
    echo Please run this script again after installation.
    pause
    exit /b 1
)

echo.
echo Logging into Railway...
railway login

echo.
echo Initializing Railway project...
railway init

echo.
echo Setting environment variables...
railway variables set SUPABASE_DATASET_URL=https://iebtpfstqbaqfkrkavgn.supabase.co/storage/v1/object/public/dataset
railway variables set USE_LOCAL_DATA=false
railway variables set DATA_DOWNLOAD_TIMEOUT=300
railway variables set DATA_RETRY_ATTEMPTS=3

echo.
echo Deploying to Railway...
railway up

echo.
echo Deployment complete!
echo Your backend is now live on Railway.
echo Check the Railway dashboard for your deployment URL.
echo.
pause