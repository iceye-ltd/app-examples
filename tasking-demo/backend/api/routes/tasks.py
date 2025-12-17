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
    
    Includes the most common parameters. To add more ICEYE API parameters,
    add fields here and update build_task_payload().
    """
    contract_id: str
    location: Location
    imaging_mode: str
    acquisition_window: AcquisitionWindow
    reference: Optional[str] = None
    incidence_angle: Optional[dict] = None
    look_side: Optional[str] = None
    pass_direction: Optional[str] = None
    imaging_duration: Optional[int] = None
    priority: Optional[str] = None
    sla: Optional[str] = None

class FeasibilityRequest(BaseModel):
    """Feasibility check request."""
    contract_id: str
    location: Location
    imaging_mode: str
    acquisition_window: AcquisitionWindow
    reference: Optional[str] = None
    incidence_angle: Optional[dict] = None
    look_side: Optional[str] = None
    pass_direction: Optional[str] = None
    priority: Optional[str] = None
    sla: Optional[str] = None


def build_feasibility_payload(req: FeasibilityRequest) -> list:
    """Convert frontend request to ICEYE Feasibility API format (array)."""
    payload = {
        "contractID": req.contract_id,
        "imagingMode": req.imaging_mode,
        "pointOfInterest": {"lat": req.location.lat, "lon": req.location.lon},
        "acquisitionWindow": {"start": req.acquisition_window.start, "end": req.acquisition_window.end}
    }
    if req.reference:
        payload["reference"] = req.reference
    if req.incidence_angle:
        payload["incidenceAngle"] = req.incidence_angle
    if req.look_side:
        payload["lookSide"] = req.look_side
    if req.pass_direction:
        payload["passDirection"] = req.pass_direction
    if req.priority:
        payload["priority"] = req.priority
    if req.sla:
        payload["sla"] = req.sla
    return [payload]

def build_task_payload(task: TaskRequest) -> dict:
    """Convert frontend request to ICEYE Task API format."""
    payload = {
        "contractID": task.contract_id,
        "imagingMode": task.imaging_mode,
        "pointOfInterest": {"lat": task.location.lat, "lon": task.location.lon},
        "acquisitionWindow": {"start": task.acquisition_window.start, "end": task.acquisition_window.end}
    }
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


@router.post("/feasibility")
async def check_feasibility(req: FeasibilityRequest):
    """
    Check if a tasking request is feasible before creating a task.
    
    Returns feasibility status and details about potential imaging opportunities.
    
    API: POST /tasking/v2/feasibility
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/checkFeasibility
    Guide: https://docs.iceye.com/constellation/api/tasking/check-feasibility/
    """
    token = await get_iceye_token()
    payload = build_feasibility_payload(req)
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.post(
            f"{ICEYE_API_URL}/tasking/v2/feasibility",
            headers={"Authorization": f"Bearer {token}"},
            json=payload
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Feasibility check failed: {response.text}"
        )
    
    return response.json()

@router.get("")
async def list_tasks(
    limit: int = 50,
    contractID: Optional[str] = None,
    cursor: Optional[str] = None
):
    """
    List all tasks with optional filtering and pagination.
    
    API: GET /tasking/v2/tasks
    API Reference: https://docs.iceye.com/constellation/api/specification/tasking/v2/#operation/getTasks
    """
    token = await get_iceye_token()
    
    params = {"limit": limit}
    if contractID:
        params["contractID"] = contractID
    if cursor:
        params["cursor"] = cursor
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        response = await client.get(
            f"{ICEYE_API_URL}/tasking/v2/tasks",
            headers={"Authorization": f"Bearer {token}"},
            params=params
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to list tasks: {response.text}"
        )
    
    return response.json()

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
