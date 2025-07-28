@echo off

echo Installing Python dependencies...
pip install -r requirements.txt

if not exist .env (
    echo Creating .env file from example...
    copy .env.example .env
    echo Please update .env file with your database credentials
)

echo Starting Flask application...
python main.py

pause
