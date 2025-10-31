"""
ICEYE Tasking Demo - Backend API

A simple proxy server that:
1. Handles OAuth2 authentication with ICEYE
2. Forwards requests to ICEYE APIs
3. Returns responses to the frontend

This keeps credentials secure (never exposed to browser) and
provides a clean separation between frontend and ICEYE APIs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging
from dotenv import load_dotenv
from api.routes import contracts, tasks

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# Load environment variables from .env file
load_dotenv()

# Create FastAPI app
app = FastAPI(
    title="ICEYE Tasking Demo API",
    description="Simple proxy for ICEYE Tasking API v2",
    version="1.0.0"
)

# Enable CORS so frontend can call this API
# Configure FRONTEND_URL in .env for production deployment
# Note: Using ["*"] for methods/headers to allow easy extension of this demo.
# For production, restrict to only the methods and headers your app actually uses.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:5173")],
    allow_credentials=True,
    allow_methods=["*"],  # Allows extension - restrict in production
    allow_headers=["*"],  # Allows custom headers - restrict in production
)

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "message": "ICEYE Tasking Demo API",
        "status": "running",
        "docs": "/docs"
    }

# Register API routes
app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts"])
app.include_router(tasks.router, prefix="/api/tasks", tags=["Tasks"])
