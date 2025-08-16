@echo off
REM SupplyNet Quick Start Script for Windows
REM This script sets up and runs SupplyNet locally

echo 🚀 SupplyNet Quick Start
echo ========================

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not running. Please start Docker Desktop and try again.
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available. Please ensure Docker Desktop is properly installed.
    pause
    exit /b 1
)

echo ✅ Docker environment check passed

REM Create necessary directories
echo 📁 Creating necessary directories...
if not exist "backend\models" mkdir "backend\models"
if not exist "backend\logs" mkdir "backend\logs"

REM Set environment variables
set DATABASE_URL=sqlite:///./supplynet.db
set LOG_LEVEL=INFO

echo 🔧 Environment configured

REM Build and start services
echo 🏗️ Building and starting services...
docker-compose up --build -d

echo ⏳ Waiting for services to be ready...

REM Wait for backend to be healthy
echo 🔍 Checking backend health...
set max_attempts=30
set attempt=1

:health_check_loop
curl -f http://localhost:8000/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy!
    goto :backend_ready
)

echo ⏳ Waiting for backend... (attempt %attempt%/%max_attempts%)
timeout /t 2 /nobreak >nul
set /a attempt+=1

if %attempt% leq %max_attempts% goto :health_check_loop

echo ❌ Backend failed to become healthy. Check logs with: docker-compose logs backend
pause
exit /b 1

:backend_ready
REM Initialize backend with sample data
echo 📊 Initializing backend with sample data...
docker-compose exec backend python start.py

echo.
echo 🎉 SupplyNet is now running!
echo.
echo 📱 Frontend: http://localhost:5173
echo 🔌 Backend API: http://localhost:8000
echo 📚 API Documentation: http://localhost:8000/docs
echo.
echo 🛠️ Useful commands:
echo   View logs: docker-compose logs -f
echo   Stop services: docker-compose down
echo   Restart: docker-compose restart
echo   Update: docker-compose up --build -d
echo.
echo 🚀 Happy optimizing!

REM Open browser
start http://localhost:5173

pause
