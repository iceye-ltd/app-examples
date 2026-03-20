"""
Catalog endpoints - proxy to ICEYE Catalog API v2.

Provides browsing and searching of the ICEYE satellite image catalog.
Results are returned as STAC items (GeoJSON features) with thumbnail assets.
"""
import logging
from typing import Any, Optional, List, Dict
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
import httpx
from api.config import ICEYE_API_URL, API_TIMEOUT
from api.routes.auth import get_iceye_token
from api.errors import raise_api_error

logger = logging.getLogger(__name__)
router = APIRouter()



class SearchRequest(BaseModel):
    """
    Catalog search request body.

    Supports STAC API search parameters: bbox, datetime, collections,
    query filters, and sorting.
    """
    bbox: Optional[List[float]] = None
    datetime: Optional[str] = None
    ids: Optional[List[str]] = None
    collections: Optional[List[str]] = None
    contractID: Optional[str] = None
    limit: Optional[int] = 10
    query: Optional[Dict[str, Any]] = None
    sortby: Optional[List[Dict[str, Any]]] = None
    intersects: Optional[Dict[str, Any]] = None


@router.get("/items")
async def list_items(
    limit: int = Query(10, ge=1, le=100),
    cursor: Optional[str] = None,
    bbox: Optional[str] = None,
    datetime_range: Optional[str] = Query(None, alias="datetime"),
    ids: Optional[str] = None,
    collections: Optional[str] = None,
    contractID: Optional[str] = None,
    sortby: Optional[str] = None,
):
    """
    Browse the ICEYE public catalog.

    Returns STAC items with optional filtering by bounding box, date range,
    collection, and more. Supports cursor-based pagination.

    API: GET /catalog/v2/items
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/listCatalogItems
    Guide: https://docs.iceye.com/constellation/api/catalog/list-catalog-items/
    """
    token = await get_iceye_token()

    params = {
        k: v for k, v in {
            "limit": limit,
            "cursor": cursor,
            "bbox": bbox,
            "datetime": datetime_range,
            "ids": ids,
            "collections": collections,
            "contractID": contractID,
            "sortby": sortby,
        }.items() if v is not None
    }

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/catalog/v2/items",
                headers={"Authorization": f"Bearer {token}"},
                params=params
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Catalog request timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to list catalog items", response)

    return response.json()


@router.post("/search")
async def search_items(req: SearchRequest):
    """
    Search the ICEYE catalog with advanced filters.

    Supports STAC query extension for filtering by metadata properties,
    bounding box, date-time range, GeoJSON intersects, and sorting.

    Pagination: use the cursor from the response with GET /catalog/items.

    API: POST /catalog/v2/search
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/searchCatalogItems
    Guide: https://docs.iceye.com/constellation/api/catalog/search-catalog-items/
    """
    token = await get_iceye_token()

    payload = req.model_dump(exclude_none=True)

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.post(
                f"{ICEYE_API_URL}/catalog/v2/search",
                headers={
                    "Authorization": f"Bearer {token}",
                    "Content-Type": "application/json",
                },
                json=payload
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Catalog search timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Catalog search failed", response)

    return response.json()


@router.get("/price")
async def get_frame_price(
    contractID: str = Query(...),
    frameID: str = Query(...),
    eula: str = Query("STANDARD"),
):
    """
    Get the price of a frame before purchasing.

    Returns the price amount and currency for the specified frame
    under the given contract's pricing model.

    API: GET /catalog/v2/price
    API Reference: https://docs.iceye.com/constellation/api/specification/catalog/v2/#operation/getFramePrice
    Guide: https://docs.iceye.com/constellation/api/catalog/get-frame-price/
    """
    token = await get_iceye_token()

    try:
        async with httpx.AsyncClient(timeout=API_TIMEOUT) as client:
            response = await client.get(
                f"{ICEYE_API_URL}/catalog/v2/price",
                headers={"Authorization": f"Bearer {token}"},
                params={
                    "contractID": contractID,
                    "frameID": frameID,
                    "eula": eula,
                }
            )
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="Price check timed out")
    except httpx.ConnectError:
        raise HTTPException(status_code=502, detail="Could not connect to ICEYE API")

    if response.status_code != 200:
        raise_api_error("Failed to get frame price", response)

    return response.json()
