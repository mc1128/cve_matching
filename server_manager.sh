#!/bin/bash

# Server Management Script for CVE Matching Project

BACKEND_PORT=8000
FRONTEND_PORT=3001
PROJECT_DIR="/workspaces/cve_matching"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    local port=$1
    if lsof -i :$port > /dev/null 2>&1; then
        return 0  # Port is in use
    else
        return 1  # Port is free
    fi
}

# Function to start backend server
start_backend() {
    echo -e "${YELLOW}Starting FastAPI backend server...${NC}"
    cd "$PROJECT_DIR/backend"
    
    if check_port $BACKEND_PORT; then
        echo -e "${RED}Backend server is already running on port $BACKEND_PORT${NC}"
        return 1
    fi
    
    source ../venv/bin/activate
    nohup uvicorn app.fastapi_main:app --host 0.0.0.0 --port $BACKEND_PORT --reload > ../logs/backend.log 2>&1 &
    echo $! > ../logs/backend.pid
    echo -e "${GREEN}Backend server started successfully on port $BACKEND_PORT${NC}"
    echo "Logs: tail -f $PROJECT_DIR/logs/backend.log"
}

# Function to start frontend server
start_frontend() {
    echo -e "${YELLOW}Starting Next.js frontend server...${NC}"
    cd "$PROJECT_DIR/frontend"
    
    if check_port $FRONTEND_PORT; then
        echo -e "${RED}Frontend server is already running on port $FRONTEND_PORT${NC}"
        return 1
    fi
    
    nohup npm run dev -- --port $FRONTEND_PORT > ../logs/frontend.log 2>&1 &
    echo $! > ../logs/frontend.pid
    echo -e "${GREEN}Frontend server started successfully on port $FRONTEND_PORT${NC}"
    echo "Logs: tail -f $PROJECT_DIR/logs/frontend.log"
}

# Function to stop servers
stop_servers() {
    echo -e "${YELLOW}Stopping servers...${NC}"
    
    # Stop backend
    if [ -f "$PROJECT_DIR/logs/backend.pid" ]; then
        local backend_pid=$(cat "$PROJECT_DIR/logs/backend.pid")
        if kill -0 $backend_pid 2>/dev/null; then
            kill $backend_pid
            rm "$PROJECT_DIR/logs/backend.pid"
            echo -e "${GREEN}Backend server stopped${NC}"
        fi
    fi
    
    # Stop frontend
    if [ -f "$PROJECT_DIR/logs/frontend.pid" ]; then
        local frontend_pid=$(cat "$PROJECT_DIR/logs/frontend.pid")
        if kill -0 $frontend_pid 2>/dev/null; then
            kill $frontend_pid
            rm "$PROJECT_DIR/logs/frontend.pid"
            echo -e "${GREEN}Frontend server stopped${NC}"
        fi
    fi
    
    # Fallback: kill by port
    pkill -f "uvicorn.*fastapi_main" || true
    pkill -f "next-server" || true
}

# Function to show server status
status() {
    echo -e "${YELLOW}Server Status:${NC}"
    
    if check_port $BACKEND_PORT; then
        echo -e "${GREEN}✓ Backend server is running on port $BACKEND_PORT${NC}"
    else
        echo -e "${RED}✗ Backend server is not running${NC}"
    fi
    
    if check_port $FRONTEND_PORT; then
        echo -e "${GREEN}✓ Frontend server is running on port $FRONTEND_PORT${NC}"
    else
        echo -e "${RED}✗ Frontend server is not running${NC}"
    fi
}

# Function to restart servers
restart() {
    stop_servers
    sleep 2
    start_backend
    sleep 3
    start_frontend
}

# Create logs directory if it doesn't exist
mkdir -p "$PROJECT_DIR/logs"

# Main command handling
case "$1" in
    start)
        start_backend
        sleep 3
        start_frontend
        ;;
    stop)
        stop_servers
        ;;
    restart)
        restart
        ;;
    status)
        status
        ;;
    backend)
        start_backend
        ;;
    frontend)
        start_frontend
        ;;
    *)
        echo "Usage: $0 {start|stop|restart|status|backend|frontend}"
        echo "  start     - Start both backend and frontend servers"
        echo "  stop      - Stop all servers"
        echo "  restart   - Restart all servers"
        echo "  status    - Show server status"
        echo "  backend   - Start only backend server"
        echo "  frontend  - Start only frontend server"
        exit 1
        ;;
esac
