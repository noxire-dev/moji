#!/bin/bash

# Store the root directory
ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

# Start backend in background
cd "$ROOT_DIR/backend"
uvicorn app.main:app --reload --port 8000 &
BACKEND_PID=$!

# Start frontend in background
cd "$ROOT_DIR/frontend"
npm run dev &
FRONTEND_PID=$!

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
