#!/bin/bash

# Set environment variables
export CHOKIDAR_USEPOLLING=true
export PLAID_CLIENT_ID=your_client_id
export PLAID_SECRET_SANDBOX=your_plaid_secret_sandbox
export PLAID_SECRET_PRODUCTION=your_plaid_secret_production
export PLAID_SANDBOX_REDIRECT_URI=http://localhost:3001/oauth-link
export PLAID_PRODUCTION_REDIRECT_URI=http://localhosts:3001/oauth-link
export PLAID_ENV=production
export PORT=5001
export DB_PORT=5432
export DB_HOST_NAME=localhost
export POSTGRES_USER=postgres
export POSTGRES_PASSWORD=xxxxxx
# Add any other environment variables following the same pattern

# Install dependencies (if necessary)
echo "Installing dependencies..."
npm install

# Optionally, clear out node_modules and reinstall if you're switching environments or need a clean slate
# rm -rf node_modules
# npm ci

# Run the server
echo "Starting the server..."
npm run debug

# Replace `npm run debug` with the appropriate command to start your server,
# such as `npm start` for production environments or other custom npm scripts you have defined.
