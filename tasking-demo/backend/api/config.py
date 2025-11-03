"""
Configuration module - loads environment variables once at startup.

This avoids reading from os.getenv() on every request, which is a best practice
for performance and maintainability.

All required environment variables are validated at import time, so the application
fails fast with clear error messages if configuration is missing.
"""
import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Read configuration once at startup (not on every request)
ICEYE_API_URL = os.getenv("ICEYE_API_URL")
ICEYE_AUTH_URL = os.getenv("ICEYE_AUTH_URL")
ICEYE_CLIENT_ID = os.getenv("ICEYE_CLIENT_ID")
ICEYE_CLIENT_SECRET = os.getenv("ICEYE_CLIENT_SECRET")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")

# Validate required configuration at startup
_missing_vars = []

if not ICEYE_API_URL:
    _missing_vars.append("ICEYE_API_URL")
if not ICEYE_AUTH_URL:
    _missing_vars.append("ICEYE_AUTH_URL")
if not ICEYE_CLIENT_ID or ICEYE_CLIENT_ID == "your-client-id-here":
    _missing_vars.append("ICEYE_CLIENT_ID")
if not ICEYE_CLIENT_SECRET or ICEYE_CLIENT_SECRET == "your-client-secret-here":
    _missing_vars.append("ICEYE_CLIENT_SECRET")

if _missing_vars:
    raise ValueError(
        f"Missing or invalid required environment variables: {', '.join(_missing_vars)}. "
        f"Please check your backend/.env file."
    )
