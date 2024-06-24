#!/bin/bash

# Set environment variables
export CHOKIDAR_USEPOLLING=true
export PORT=3001
export REACT_APP_SERVER_PORT=5001
export REACT_APP_PLAID_ENV=production

# Install dependencies
echo "Installing dependencies..."
npm install --force

# Set the port for React applications via .env file
# echo "PORT=3001" > .env
# For Node.js applications, ensure the server listens on the correct port in your application code

# Start the application
echo "Starting the application..."
npm start

# If you have a specific script for development, replace `npm start` with `npm run your-script-name`
