"""
Purchases endpoints - proxy to ICEYE Catalog API v2.

Handles the purchase workflow: buying frames, checking purchase status,
listing purchase history, and viewing purchased products.
"""
import logging
import re
from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from api.config import ICEYE_API_URL, API_TIMEOUT
from api.routes.auth import get_iceye_token
from api.errors import raise_api_error

logger = logging.getLogger(__name__)
router = APIRouter()


UUID_PATTERN = re.compile(r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$', re.IGNORECASE)


def _validate_purchase_id(purchase_id: str) -> str:
    """Validate purchase_id format to prevent path traversal."""
    if not UUID_PATTERN.match(purchase_id):
        raise HTTPException(status_code=400, detail="Invalid purchase ID format")
    return purchase_id


class PurchaseRequest(BaseModel):
    """Purchase a frame from the catalog."""
    contractID: str
    frameID: str
    reference: Optional[str] = None
    eula: str = "STANDARD"


@router.post("")
async def purchase_frame(req: PurchaseRequest):
    """
    Purchase a frame from the ICEYE catalog.

    Creates an order for the specified frame under the given contract.
    Returns the purchase ID and initial status.

    API: POST /catalog/v2/purchases
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/purchaseFrame
    Guide: https://docs.iceye.com/constellation/api/catalog/purchase-frame/
    """
    token = await get_iceye_token()
    payload = req.model_dump(exclude_none=True)

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.post(
                f"{ICEYE_API_URL}/catalog/v2/purchases",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Purchase request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code not in (200, 201):
        raise_api_error("Failed to purchase frame", response)

    return response.json()


@router.get("")
async def list_purchases(
    limit: int = Query(100, ge=1, le=500),
    cursor: Optional[str] = None,
):
    """
    List all purchases for the current user.

    Returns purchase history sorted by most recently modified.
    Supports cursor-based pagination.

    API: GET /catalog/v2/purchases
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/listPurchases
    Guide: https://docs.iceye.com/constellation/api/catalog/list-purchases/
    """
    token = await get_iceye_token()

    params = {"limit": limit}
    if cursor:
        params["cursor"] = cursor

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/catalog/v2/purchases",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Purchases request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to list purchases", response)

    return response.json()


@router.get("/{purchase_id}")
async def get_purchase(purchase_id: str):
    """
    Get the status of a specific purchase.

    Status values: received, active, closed, canceled, failed.

    API: GET /catalog/v2/purchases/{purchaseId}
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/getPurchase
    Guide: https://docs.iceye.com/constellation/api/catalog/get-purchase/
    """
    _validate_purchase_id(purchase_id)
    token = await get_iceye_token()

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/catalog/v2/purchases/{purchase_id}",
                headers={"Authorization": f"Bearer {token}"}
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Purchase status request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to get purchase", response)

    return response.json()


@router.get("/{purchase_id}/products")
async def list_purchase_products(purchase_id: str):
    """
    List all products associated with a purchase.

    Returns STAC items with download links for the purchased imagery.

    API: GET /catalog/v2/purchases/{purchaseId}/products
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/listPurchaseProducts
    Guide: https://docs.iceye.com/constellation/api/catalog/list-purchase-products/
    """
    _validate_purchase_id(purchase_id)
    token = await get_iceye_token()

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/catalog/v2/purchases/{purchase_id}/products",
                headers={"Authorization": f"Bearer {token}"}
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Products request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to list purchase products", response)

    return response.json()
