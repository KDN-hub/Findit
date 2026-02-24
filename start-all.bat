@echo off
echo Starting Findit Project...
echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && venv\Scripts\python.exe -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"
timeout /t 3 /nobreak >nul
echo.
echo Starting Frontend Server...
start "Frontend Server" cmd /k "npm run dev"
echo.
echo Both servers are starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
pause
