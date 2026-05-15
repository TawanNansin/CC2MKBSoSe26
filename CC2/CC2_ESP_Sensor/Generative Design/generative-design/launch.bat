@echo off
echo Starting Constellation Generator...

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo Found Python! Starting server...
    start http://localhost:8000
    python -m http.server 8000
) else (
    echo Python not found, trying Node.js...
    node --version >nul 2>&1
    if %errorlevel% == 0 (
        npx serve . -l 8000
        start http://localhost:8000
    ) else (
        echo Neither Python nor Node.js found.
        echo Please install Python from https://www.python.org/downloads/
        pause
    )
)