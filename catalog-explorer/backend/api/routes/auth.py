"""
Authentication helper - gets and caches OAuth2 tokens from ICEYE.

Uses OAuth2 Client Credentials flow. Tokens are cached in memory with a
5-minute safety margin before expiry to avoid using stale tokens.
"""
import asyncio
import base64
import httpx
import logging
from datetime import datetime, timedelta
from fastapi import HTTPException
from api.config import ICEYE_CLIENT_ID, ICEYE_CLIENT_SECRET, ICEYE_AUTH_URL

logger = logging.getLogger(__name__)

_token_cache = {"token": None, "expires_at": None}
_token_lock = asyncio.Lock()


async def get_iceye_token():
    """
    Get a valid OAuth2 token from ICEYE.

    Caches the token in memory to avoid calling ICEYE auth on every request.
    Automatically refreshes when expired. Uses a lock to prevent concurrent
    requests from triggering multiple token refreshes.

    Returns:
        str: Access token
    """
    if _token_cache["token"] and _token_cache["expires_at"]:
        if datetime.now() < _token_cache["expires_at"]:
            return _token_cache["token"]

    async with _token_lock:
        # Double-check after acquiring lock (another request may have refreshed)
        if _token_cache["token"] and _token_cache["expires_at"]:
            if datetime.now() < _token_cache["expires_at"]:
                return _token_cache["token"]

        auth_url = f"{ICEYE_AUTH_URL}/v1/token"
        logger.info("Requesting auth token from %s", auth_url)

        credentials = f"{ICEYE_CLIENT_ID}:{ICEYE_CLIENT_SECRET}"
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
                error_detail = f"{error_detail}: {error_data.get('error_description', error_data.get('message', ''))}"
            except (ValueError, KeyError):
                pass

            if response.status_code == 404:
                error_detail += " - Verify ICEYE_AUTH_URL is correct (should be the OAuth base URL without /v1/token)"

            logger.error(error_detail)
            raise HTTPException(status_code=502, detail=error_detail)

        data = response.json()
        access_token = data.get('access_token')
        expires_in = data.get('expires_in', 3600)

        if not access_token:
            raise HTTPException(status_code=502, detail="Auth response missing access_token")

        safety_margin = min(300, expires_in // 2)
        _token_cache["token"] = access_token
        _token_cache["expires_at"] = datetime.now() + timedelta(seconds=expires_in - safety_margin)

        logger.info("Token cached, expires at %s", _token_cache["expires_at"].strftime("%H:%M:%S"))

        return access_token
