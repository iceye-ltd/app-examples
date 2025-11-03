"""
Contracts endpoints - fetch available contracts from ICEYE.

Contracts define what imaging capabilities and parameters you can use
when creating tasking requests (e.g., imaging modes, priorities, SLAs).
"""
from fastapi import APIRouter, HTTPException
import httpx
from api.config import ICEYE_API_URL
from api.routes.auth import get_iceye_token

router = APIRouter()

@router.get("")
async def get_contracts():
    """
    Get list of available contracts.
    Contracts define what imaging capabilities you can use when creating tasks.
    
    API: GET /company/v1/contracts
    API Reference: https://docs.iceye.com/constellation/api/specification/company/v1/#operation/ListContracts
    Guide: https://docs.iceye.com/constellation/api/company/list-contracts/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/company/v1/contracts",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch contracts: {response.text}"
        )
    
    return response.json()

@router.get("/{contract_id}")
async def get_contract(contract_id: str):
    """
    Get details of a specific contract.
    Returns available imaging modes, default parameters, and constraints.
    
    API: GET /company/v1/contracts/{contractId}
    API Reference: https://docs.iceye.com/constellation/api/specification/company/v1/#operation/GetContract
    Guide: https://docs.iceye.com/constellation/api/company/get-contract/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/company/v1/contracts/{contract_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch contract: {response.text}"
        )
    
    return response.json()

@router.get("/{contract_id}/summary")
async def get_contract_summary(contract_id: str):
    """
    Get budget summary for a specific contract.
    Returns remaining credits and usage if the contract has a pricing plan.
    
    API: GET /company/v1/contracts/{contractId}/summary
    API Reference: https://docs.iceye.com/constellation/api/specification/company/v1/#operation/GetSummary
    Guide: https://docs.iceye.com/constellation/api/company/get-summary/
    """
    token = await get_iceye_token()
    
    async with httpx.AsyncClient() as client:
        response = await client.get(
            f"{ICEYE_API_URL}/company/v1/contracts/{contract_id}/summary",
            headers={"Authorization": f"Bearer {token}"}
        )
    
    if response.status_code != 200:
        raise HTTPException(
            status_code=response.status_code,
            detail=f"Failed to fetch contract summary: {response.text}"
        )
    
    return response.json()
