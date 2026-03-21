#!/bin/bash

# Soccer Chemistry Backend - VPS Startup Script
# This script starts the Flask backend on VPS with proper configuration

echo "🚀 Starting Soccer Chemistry Backend on VPS..."
echo "================================================"

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 is not installed!"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Install/update dependencies
echo "📥 Installing dependencies..."
pip install --no-cache-dir -r requirements.txt

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found, using defaults"
fi

# Start Flask
echo "🌐 Starting Flask on 0.0.0.0:8000..."
echo "📍 Backend will be accessible at: http://95.217.85.62:8000"
echo "================================================"
echo ""

# Run Flask
python3 flask_app.py
