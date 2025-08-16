#!/bin/bash

# SupplyNet Quick Start Script
# This script sets up and runs SupplyNet locally

set -e

echo "🚀 SupplyNet Quick Start"
echo "========================"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

echo "✅ Docker environment check passed"

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p backend/models
mkdir -p backend/logs

# Set environment variables
export DATABASE_URL="sqlite:///./supplynet.db"
export LOG_LEVEL="INFO"

echo "🔧 Environment configured"

# Build and start services
echo "🏗️ Building and starting services..."
docker-compose up --build -d

echo "⏳ Waiting for services to be ready..."

# Wait for backend to be healthy
echo "🔍 Checking backend health..."
max_attempts=30
attempt=1

while [ $attempt -le $max_attempts ]; do
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        echo "✅ Backend is healthy!"
        break
    fi
    
    echo "⏳ Waiting for backend... (attempt $attempt/$max_attempts)"
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    echo "❌ Backend failed to become healthy. Check logs with: docker-compose logs backend"
    exit 1
fi

# Initialize backend with sample data
echo "📊 Initializing backend with sample data..."
docker-compose exec backend python start.py

echo ""
echo "🎉 SupplyNet is now running!"
echo ""
echo "📱 Frontend: http://localhost:5173"
echo "🔌 Backend API: http://localhost:8000"
echo "📚 API Documentation: http://localhost:8000/docs"
echo ""
echo "🛠️ Useful commands:"
echo "  View logs: docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart: docker-compose restart"
echo "  Update: docker-compose up --build -d"
echo ""
echo "🚀 Happy optimizing!"

# Optional: Open browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v start &> /dev/null; then
    start http://localhost:5173
fi
