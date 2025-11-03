"""
Tasks endpoints - proxy to ICEYE Tasking API v2.

This is a thin proxy that forwards requests to the ICEYE API.
Validation is handled by the ICEYE API to keep this code simple and maintainable.
For production use, consider adding input validation and rate limiting.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
import httpx
from api.config import ICEYE_API_URL
from api.routes.auth import get_iceye_token

router = APIRouter()

class Location(BaseModel):
    """Geographic coordinates."""
    lat: float
    lon: float

class AcquisitionWindow(BaseModel):
    """Time window for satellite imaging."""
    start: str
    end: str

class TaskRequest(BaseModel):
    """
    Task creation request.
    
    Note: This model includes the most common parameters.
    To add more ICEYE API parameters, add them here and update build_task_payload().
    """
    # Required fields
    contract_id: str
    location: Location
    imaging_mode: str  # e.g., "SPOTLIGHT_HIGH"
    acquisition_window: AcquisitionWindow
    
    # Optional fields
    reference: Optional[str] = None
    incidence_angle: Optional[dict] = None  # {"min": 10, "max": 45}
    look_side: Optional[str] = None  # "LEFT", "RIGHT", or "ANY"
    pass_direction: Optional[str] = None  # "ASCENDING", "DESCENDING", or "ANY"
    imaging_duration: Optional[int] = None  # Duration in seconds
    priority: Optional[str] = None  # "BACKGROUND" or "COMMERCIAL"
    sla: Optional[str] = None  # Service Level Agreement (e.g., "SLA_12H")

def build_task_payload(task: TaskRequest) -> dict:
    """
    Convert frontend snake_case to ICEYE API format.
    Only includes fields that are provided (not None).
    """
    payload = {
        "contractID": task.contract_id,  # Note: API uses "contractID" not "contractId"
        "imagingMode": task.imaging_mode,
        "pointOfInterest": {
            "lat": task.location.lat,
            "lon": task.location.lon
        },
        "acquisitionWindow": {
            "start": task.acquisition_window.start,
            "end": task.acquisition_window.end
        }
    }
    
    # Add optional fields only if provided
    if task.reference:
        payload["reference"] = task.reference
    
    if task.incidence_angle:
        payload["incidenceAngle"] = task.incidence_angle
    
    if task.look_side:
        payload["lookSide"] = task.look_side
    
    if task.imaging_duration:
        payload["imagingDuration"] = task.imaging_duration
    
    if task.pass_direction:
        payload["passDirection"] = task.pass_direction
    
    if task.priority:
        payload["priority"] = task.priority
    
    if task.sla:
        payload["sla"] = task.sla
    
    return payload

@router.post("")
async def create_task(task: TaskRequest):
    """
    Create a new tasking request.
    
    API: POST /tasking/v2/tasks
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/createTask
    Guide: https://docs.iceye.com/constellation/api/tasking/create-task/
    """
    token = await get_iceye_token()
    payload = build_task_payload(task)
    
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"{ICEYE_API_URL}/tasking/v2/tasks",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    
    if response.status_code != 201:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to create task: {response.text}"
        )
    
    return response.json()

@router.get("/{task_id}")
async def get_task_status(task_id: str):
    """
    Get current status and details of a task.
    
    API: GET /tasking/v2/tasks/{taskId}
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/getTask
    Guide: https://docs.iceye.com/constellation/api/tasking/get-task/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/tasking/v2/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to get task: {response.text}"
        )
    
    return response.json()

@router.get("/{task_id}/products")
async def get_task_products(task_id: str):
    """
    Get products for a task.
    
    Products are available when task status is FULFILLED or DONE.
    - FULFILLED: SLA products are ready (initial delivery)
    - DONE: All products are ready (final delivery)
    
    API: GET /tasking/v2/tasks/{taskId}/products
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/getTaskProduct
    Guide: https://docs.iceye.com/constellation/api/tasking/task-products/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/tasking/v2/tasks/{task_id}/products",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to get products: {response.text}"
        )
    
    return response.json()

@router.get("/{task_id}/scene")
async def get_task_scene(task_id: str):
    """
    Get scene details for a scheduled task.
    
    Available when task status is ACTIVE, FULFILLED, or DONE.
    
    API: GET /tasking/v2/tasks/{taskId}/scene
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/getTaskScene
    Guide: https://docs.iceye.com/constellation/api/tasking/get-task-scene/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/tasking/v2/tasks/{task_id}/scene",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to get scene: {response.text}"
        )
    
    return response.json()

@router.patch("/{task_id}")
async def cancel_task(task_id: str):
    """
    Cancel a task.
    
    Can only cancel tasks with status RECEIVED or ACTIVE.
    
    API: PATCH /tasking/v2/tasks/{taskId}
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/cancelTask
    Guide: https://docs.iceye.com/constellation/api/tasking/cancel-task/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.patch(
            f"{ICEYE_API_URL}/tasking/v2/tasks/{task_id}",
            headers={"Authorization": f"Bearer {token}"},
            json={"status": "CANCELED"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to cancel task: {response.text}"
        )
    
    return response.json()
