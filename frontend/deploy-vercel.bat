@echo off
echo Deploying Soccer Chemistry Frontend to Vercel...
echo.

REM Check if vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Vercel CLI not found. Installing...
    npm install -g vercel
)

echo.
echo Building and deploying frontend...
echo Backend URL: https://backend-ten-omega-11.vercel.app/api
echo.

REM Deploy to Vercel
vercel --prod

echo.
echo Deployment complete!
echo Your frontend is now live on Vercel.
echo.
pause