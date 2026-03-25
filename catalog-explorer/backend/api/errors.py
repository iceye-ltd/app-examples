"""Shared error handling utilities for API route modules."""
import logging
from fastapi import HTTPException
import httpx

logger = logging.getLogger(__name__)


def raise_api_error(context: str, response: httpx.Response):
    """Log the full upstream error and raise a user-friendly HTTPException."""
    logger.error("%s: HTTP %d - %s", context, response.status_code, response.text)
    try:
        data = response.json()
        detail = data.get("message", data.get("detail", context))
    except (ValueError, KeyError):
        detail = context
    raise HTTPException(status_code=response.status_code, detail=detail)
