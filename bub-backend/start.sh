#!/bin/bash

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env file exists, create from example if not
if [ ! -f .env ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please update .env file with your database credentials"
fi

# Start the application
echo "Starting Flask application..."
python main.py
