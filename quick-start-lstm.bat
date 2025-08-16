@echo off
echo ========================================
echo SupplyNet LSTM Production System
echo ========================================
echo.

echo Starting backend services...
cd backend

echo Installing dependencies...
pip install -r requirements.txt

echo Starting FastAPI backend...
start "SupplyNet Backend" python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload

echo Waiting for backend to start...
timeout /t 10 /nobreak >nul

echo Starting frontend...
cd ..
npm install
start "SupplyNet Frontend" npm run dev

echo.
echo ========================================
echo System is starting up!
echo ========================================
echo Backend: http://localhost:8000
echo Frontend: http://localhost:5173
echo API Docs: http://localhost:8000/docs
echo.
echo To deploy LSTM models, run:
echo python deploy_production.py
echo.
echo Press any key to open the frontend...
pause >nul

start http://localhost:5173
start http://localhost:8000/docs

echo.
echo SupplyNet LSTM system is ready!
echo Check the browser windows that opened.
echo.
pause
