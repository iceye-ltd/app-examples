"""
Authentication helper - gets and caches OAuth2 tokens from ICEYE.
"""
import base64
import httpx
import os
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException

logger = logging.getLogger(__name__)

# In-memory token cache
_token_cache = {"token": None, "expires_at": None}

async def get_iceye_token():
    """
    Get a valid OAuth2 token from ICEYE.
    
    Caches the token in memory to avoid calling ICEYE auth on every request.
    Automatically refreshes when expired.
    
    Returns:
        str: Access token
    """
    
    # Return cached token if still valid
    if _token_cache["token"] and _token_cache["expires_at"]:
        if datetime.now() < _token_cache["expires_at"]:
            return _token_cache["token"]
    
    # Check credentials are configured
    client_id = os.getenv('ICEYE_CLIENT_ID')
    client_secret = os.getenv('ICEYE_CLIENT_SECRET')
    
    if not client_id or not client_secret or client_id == 'your-client-id-here':
        logger.error("ICEYE credentials not configured in .env file")
        raise HTTPException(
            status_code=500,
            detail="ICEYE API credentials not configured. Please update backend/.env file."
        )
    
    # Get new token from ICEYE
    # Append /v1/token to the base OAuth URL provided by ICEYE
    auth_base_url = os.getenv('ICEYE_AUTH_URL')
    auth_url = f"{auth_base_url}/v1/token"
    logger.info(f"Requesting auth token from {auth_url}")
    
    credentials = f"{client_id}:{client_secret}"
    base64_credentials = base64.b64encode(credentials.encode()).decode()
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            url=auth_url,
            headers={
                'Authorization': f'Basic {base64_credentials}',
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            data={'grant_type': 'client_credentials'}
        )
    
    if response.status_code != 200:
        error_detail = f"Authentication failed (HTTP {response.status_code})"
        try:
            error_data = response.json()
            error_detail = f"{error_detail}: {error_data.get('error_description', error_data.get('message', response.text))}"
        except:
            error_detail = f"{error_detail}: {response.text}"
        
        # Provide helpful hint for 404 errors
        if response.status_code == 404:
            error_detail += " - Verify ICEYE_AUTH_URL is correct (should be the OAuth base URL without /v1/token)"
        
        logger.error(error_detail)
        raise HTTPException(
            status_code=response.status_code,
            detail=error_detail
        )
    
    # Parse and cache token
    data = response.json()
    access_token = data['access_token']
    expires_in = data['expires_in']
    
    # Cache with 5-minute safety margin
    _token_cache["token"] = access_token
    _token_cache["expires_at"] = datetime.now() + timedelta(seconds=expires_in - 300)
    
    logger.info(f"Token cached, expires at {_token_cache['expires_at'].strftime('%H:%M:%S')}")
    
    return access_token
