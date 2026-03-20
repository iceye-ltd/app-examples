"""
Contracts endpoints - fetch available contracts from ICEYE.

Contracts define what capabilities and pricing plans are available
for catalog purchases and tasking requests.
"""
import logging
from fastapi import APIRouter, HTTPException
import httpx
from api.config import ICEYE_API_URL, API_TIMEOUT
from api.routes.auth import get_iceye_token
from api.errors import raise_api_error

logger = logging.getLogger(__name__)
router = APIRouter()



@router.get("")
async def get_contracts():
    """
    Get list of available contracts.

    API: GET /company/v1/contracts
    API Reference: https://docs.iceye.com/constellation/api/specification/company/v1/#operation/ListContracts
    Guide: https://docs.iceye.com/constellation/api/company/list-contracts/
    """
    token = await get_iceye_token()

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/company/v1/contracts",
                headers={"Authorization": f"Bearer {token}"}
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Contracts request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to fetch contracts", response)

    return response.json()
