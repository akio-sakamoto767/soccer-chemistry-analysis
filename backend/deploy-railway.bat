@echo off
echo 🚂 Preparing Railway Deployment...
echo.

echo Checking Python version...
python --version
echo.

echo Checking if all files exist...
if exist "Procfile" (
    echo ✅ Procfile found
) else (
    echo ❌ Procfile missing
)

if exist "railway.json" (
    echo ✅ railway.json found
) else (
    echo ❌ railway.json missing
)

if exist "requirements.txt" (
    echo ✅ requirements.txt found
) else (
    echo ❌ requirements.txt missing
)

if exist "flask_app.py" (
    echo ✅ flask_app.py found
) else (
    echo ❌ flask_app.py missing
)

echo.
echo 📋 Next Steps:
echo 1. Go to https://railway.app
echo 2. Sign up with GitHub
echo 3. Create new project from GitHub repo
echo 4. Set root directory to 'backend'
echo 5. Deploy!
echo.
echo 🔗 After deployment, update frontend VITE_API_URL with your Railway URL
echo.
pause