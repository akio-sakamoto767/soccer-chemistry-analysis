#!/bin/bash

# Soccer Chemistry Frontend - VPS Startup Script
# This script starts the Vite dev server on VPS with proper configuration

echo "🚀 Starting Soccer Chemistry Frontend on VPS..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed!"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed!"
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚠️  Warning: .env file not found!"
    echo "Creating .env file with VPS configuration..."
    cat > .env << EOF
# Frontend Environment Variables for VPS Deployment
VITE_API_URL=http://95.217.85.62:8000/api
VITE_APP_NAME=Soccer Chemistry Analysis
VITE_APP_VERSION=1.0.0
EOF
fi

# Display configuration
echo "🔧 Configuration:"
echo "   API URL: $(grep VITE_API_URL .env | cut -d '=' -f2)"
echo ""

# Start Vite dev server
echo "🌐 Starting Vite on 0.0.0.0:5173..."
echo "📍 Frontend will be accessible at: http://95.217.85.62:5173"
echo "================================================"
echo ""

# Run Vite
npm run dev
