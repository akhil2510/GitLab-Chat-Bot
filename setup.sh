#!/bin/bash

# GitLab AI Chatbot - Quick Setup Script
# This script automates the initial setup process

echo "🦊 GitLab AI Chatbot - Setup Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo "Checking prerequisites..."
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js v18+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found: $(node --version)${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python is not installed. Please install Python 3.9+${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $(python3 --version)${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ npm found: $(npm --version)${NC}"

# Check pip
if ! command -v pip3 &> /dev/null; then
    echo -e "${RED}❌ pip is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ pip found${NC}"

echo ""
echo "Setting up environment files..."

# Setup backend .env
if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo -e "${GREEN}✓ Created backend/.env${NC}"
    echo -e "${YELLOW}⚠️  Please edit backend/.env and add your GEMINI_API_KEY${NC}"
else
    echo -e "${YELLOW}⚠️  backend/.env already exists${NC}"
fi

# Setup frontend .env
if [ ! -f frontend/.env ]; then
    cp frontend/.env.example frontend/.env
    echo -e "${GREEN}✓ Created frontend/.env${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/.env already exists${NC}"
fi

echo ""
echo "Installing backend dependencies..."
cd backend
npm install
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install backend dependencies${NC}"
    exit 1
fi
cd ..

echo ""
echo "Installing frontend dependencies..."
cd frontend
pip3 install -r requirements.txt
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Failed to install frontend dependencies${NC}"
    exit 1
fi
cd ..

echo ""
echo "Creating necessary directories..."
mkdir -p data logs
echo -e "${GREEN}✓ Directories created${NC}"

echo ""
echo "===================================="
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "Next steps:"
echo ""
echo "1. Edit backend/.env and add your GEMINI_API_KEY"
echo "   Get one free at: https://aistudio.google.com"
echo ""
echo "2. Scrape GitLab data:"
echo "   cd backend && npm run scrape"
echo ""
echo "3. Index the data:"
echo "   cd backend && npm run index"
echo ""
echo "4. Start the backend (in one terminal):"
echo "   cd backend && npm run dev"
echo ""
echo "5. Start the frontend (in another terminal):"
echo "   cd frontend && streamlit run app.py"
echo ""
echo "6. Open http://localhost:8501 in your browser"
echo ""
echo "See QUICKSTART.md for detailed instructions."
echo ""
