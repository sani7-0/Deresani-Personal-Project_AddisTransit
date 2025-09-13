#!/bin/bash

# Startup script for Render deployment
echo "Starting AddisTransit Backend..."

# Check if database environment variables are set
if [ -z "$DB_HOST" ]; then
    echo "Warning: No database configured. API will run with limited functionality."
    echo "To enable full functionality, set DB_HOST, DB_NAME, DB_USER, DB_PASS environment variables."
else
    echo "Database configuration found:"
    $DB_HOST = getenv('DB_HOST');
    $DB_NAME = getenv('DB_NAME');
    $DB_USER = getenv('DB_USER');
    $DB_PASS = getenv('DB_PASS');
    $DB_PORT = getenv('DB_PORT');

# Initialize database if environment variables are set
if [ ! -z "$DB_HOST" ] && [ ! -z "$DB_NAME" ] && [ ! -z "$DB_USER" ]; then
    echo "Initializing database..."
    php init-db.php
    if [ $? -eq 0 ]; then
        echo "Database initialization completed successfully"
    else
        echo "Database initialization failed, but continuing with server start"
    fi
else
    echo "Skipping database initialization - no database configuration found"
fi

# Start PHP server on port 3001 (or PORT env var)
PORT=${PORT:-3001}
echo "Starting PHP server on port $PORT..."
php -S 0.0.0.0:$PORT -t public
