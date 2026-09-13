@echo off
echo ========================================
echo   ML Service Setup and Startup
echo ========================================
echo.

REM Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH
    echo Please install Python 3.8 or higher
    pause
    exit /b 1
)

echo Python found!
python --version
echo.

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
    echo Virtual environment created!
    echo.
)

REM Activate virtual environment
echo Activating virtual environment...
call venv\Scripts\activate.bat
echo.

REM Install/upgrade pip
echo Upgrading pip...
python -m pip install --upgrade pip
echo.

REM Install requirements (simplified without TensorFlow for now)
echo Installing required packages...
pip install -r requirements.txt
echo.

REM Check if model files exist
echo Checking model files...
if not exist "expression.h5" (
    echo WARNING: expression.h5 not found!
    echo Emotion detection will use fallback mode.
)
if not exist "scaler.pkl" (
    echo WARNING: scaler.pkl not found!
)
if not exist "label_encoder.pkl" (
    echo WARNING: label_encoder.pkl not found!
)
echo.

REM Start the Flask service
echo ========================================
echo   Starting Flask ML Service
echo   Port: 5001
echo   Mode: Fallback (no TensorFlow)
echo ========================================
echo.
python app.py