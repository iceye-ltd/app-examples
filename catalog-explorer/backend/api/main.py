"""
ICEYE Catalog Explorer - Backend API

A simple proxy server that:
1. Handles OAuth2 authentication with ICEYE
2. Forwards requests to ICEYE Catalog APIs
3. Returns responses to the frontend

This keeps credentials secure (never exposed to browser) and
provides a clean separation between frontend and ICEYE APIs.
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import logging
from api.config import FRONTEND_URL
from api.routes import catalog, purchases, contracts

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

app = FastAPI(
    title="ICEYE Catalog Explorer API",
    description="Simple proxy for ICEYE Catalog API v2",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    """Health check endpoint."""
    return {
        "message": "ICEYE Catalog Explorer API",
        "status": "running",
        "docs": "/docs"
    }

app.include_router(contracts.router, prefix="/api/contracts", tags=["Contracts"])
app.include_router(catalog.router, prefix="/api/catalog", tags=["Catalog"])
app.include_router(purchases.router, prefix="/api/purchases", tags=["Purchases"])
