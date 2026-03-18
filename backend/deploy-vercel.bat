@echo off
echo Deploying Soccer Chemistry Backend to Vercel...
echo.

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
)

echo.
echo Starting deployment...
echo.

REM Deploy to Vercel
vercel --prod

echo.
echo Deployment complete!
echo Your backend is now live on Vercel.
echo.
pause