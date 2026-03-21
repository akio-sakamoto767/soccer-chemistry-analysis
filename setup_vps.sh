#!/bin/bash

# Soccer Chemistry Analysis - Complete VPS Setup Script
# This script sets up everything needed to run the application on a VPS

echo "🏗️  Soccer Chemistry Analysis - VPS Setup"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# Check if running on VPS (not Windows)
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "win32" ]]; then
    print_error "This script is for VPS (Linux) only!"
    print_info "Please run this on your VPS server, not on Windows"
    exit 1
fi

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
    print_warning "Not running as root. Some commands may require sudo."
    SUDO="sudo"
else
    SUDO=""
fi

echo ""
print_info "Step 1: Checking system requirements..."
echo "----------------------------------------"

# Check Python
if command -v python3 &> /dev/null; then
    PYTHON_VERSION=$(python3 --version)
    print_success "Python installed: $PYTHON_VERSION"
else
    print_error "Python3 not found!"
    print_info "Install with: sudo apt update && sudo apt install python3 python3-pip python3-venv"
    exit 1
fi

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found!"
    print_info "Install with: curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - && sudo apt install -y nodejs"
    exit 1
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm --version)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found!"
    exit 1
fi

echo ""
print_info "Step 2: Configuring firewall..."
echo "----------------------------------------"

# Check if UFW is installed
if command -v ufw &> /dev/null; then
    print_success "UFW firewall found"
    
    # Check if UFW is active
    if $SUDO ufw status | grep -q "Status: active"; then
        print_info "UFW is active, checking rules..."
        
        # Allow SSH if not already allowed
        if ! $SUDO ufw status | grep -q "22.*ALLOW"; then
            print_info "Opening SSH port 22..."
            $SUDO ufw allow 22/tcp
            print_success "SSH port 22 opened"
        else
            print_success "SSH port 22 already open"
        fi
        
        # Allow backend port
        if ! $SUDO ufw status | grep -q "8000.*ALLOW"; then
            print_info "Opening backend port 8000..."
            $SUDO ufw allow 8000/tcp
            print_success "Backend port 8000 opened"
        else
            print_success "Backend port 8000 already open"
        fi
        
        # Allow frontend port
        if ! $SUDO ufw status | grep -q "5173.*ALLOW"; then
            print_info "Opening frontend port 5173..."
            $SUDO ufw allow 5173/tcp
            print_success "Frontend port 5173 opened"
        else
            print_success "Frontend port 5173 already open"
        fi
        
        print_success "Firewall configured successfully"
    else
        print_warning "UFW is installed but not active"
        print_info "To enable: sudo ufw enable (make sure SSH port 22 is allowed first!)"
    fi
else
    print_warning "UFW not found - firewall configuration skipped"
    print_info "Make sure ports 22, 8000, and 5173 are open in your cloud provider's security groups"
fi

echo ""
print_info "Step 3: Setting up backend..."
echo "----------------------------------------"

cd backend

# Make start script executable
chmod +x start_vps.sh

# Check if .env exists
if [ ! -f ".env" ]; then
    print_info "Creating backend .env file..."
    cp .env.example .env
    # Update for local data
    sed -i 's/USE_LOCAL_DATA=false/USE_LOCAL_DATA=true/' .env
    print_success "Backend .env created"
else
    print_success "Backend .env already exists"
fi

cd ..

echo ""
print_info "Step 4: Setting up frontend..."
echo "----------------------------------------"

cd frontend

# Make start script executable
chmod +x start_vps.sh

# Create .env file
if [ ! -f ".env" ]; then
    print_info "Creating frontend .env file..."
    cat > .env << EOF
# Frontend Environment Variables for VPS Deployment
VITE_API_URL=http://95.217.85.62:8000/api
VITE_APP_NAME=Soccer Chemistry Analysis
VITE_APP_VERSION=1.0.0
EOF
    print_success "Frontend .env created"
else
    print_success "Frontend .env already exists"
fi

cd ..

echo ""
echo "=========================================="
print_success "VPS Setup Complete!"
echo "=========================================="
echo ""
print_info "Next steps:"
echo ""
echo "1. Start the backend:"
echo "   cd backend"
echo "   ./start_vps.sh"
echo ""
echo "2. In a new terminal, start the frontend:"
echo "   cd frontend"
echo "   ./start_vps.sh"
echo ""
echo "3. Access your application:"
echo "   Frontend: http://95.217.85.62:5173"
echo "   Backend:  http://95.217.85.62:8000"
echo ""
print_warning "Important: Don't forget to configure your cloud provider's security groups!"
print_info "Make sure ports 8000 and 5173 are open in your cloud provider's firewall"
echo ""
