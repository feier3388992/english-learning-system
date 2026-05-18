@echo off
chcp 65001 >nul
title english lerning system V6

cd /d "%~dp0"

echo ========================================
echo    english lerning system V6 is starting...
echo ========================================
echo.
echo hold down please，auto open web when service have been started...
echo press Ctrl+C can stop service
echo.

pyforwindow\python.exe -m uvicorn app.main:app --host 0.0.0.0 --port 8000
pause
start http://localhost:8000
