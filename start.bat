@echo off
title TerraEcho - Earth's Living Soundscape
echo ========================================================
echo   TerraEcho - Earth's Living Soundscape
echo   NASA Space Apps Challenge 2026: The Earth Information Jukebox
echo ========================================================
echo.
echo Launching local development server on http://localhost:8000/ ...
echo.
start http://localhost:8000/
python -m http.server 8000
if %errorlevel% neq 0 (
  echo Python not found. Attempting Node.js npx serve...
  npx serve -p 8000 .
)
pause
