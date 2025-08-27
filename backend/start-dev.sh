#!/bin/bash

echo "🚀 Starting Snap2Story Backend Development Environment"
echo "====================================================="

# Check if Redis is running
if ! nc -z localhost 6379 2>/dev/null; then
    echo "⚠️  Redis is not running. Starting Redis in Docker..."
    docker run -d --name redis-snap2story -p 6379:6379 redis:alpine
    echo "✅ Redis started"
else
    echo "✅ Redis is already running"
fi

# Kill any existing processes on port 3001
echo "🧹 Cleaning up existing processes..."
lsof -ti:3001 | xargs kill -9 2>/dev/null || true

# Start the API server in background
echo "🌐 Starting API server..."
npm run dev &
API_PID=$!

# Wait for API server to start
sleep 3

# Start the worker in background
echo "👷 Starting worker..."
npm run worker &
WORKER_PID=$!

echo ""
echo "✅ Backend services started!"
echo "====================================================="
echo "📡 API Server: http://localhost:3001"
echo "🔧 Worker: Processing jobs from Redis queue"
echo "📊 Redis: localhost:6379"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Shutting down services..."
    kill $API_PID $WORKER_PID 2>/dev/null
    echo "✅ Services stopped"
    exit 0
}

# Trap Ctrl+C
trap cleanup INT

# Keep script running
wait