from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import List, Optional
from datetime import datetime, timedelta
from src.middleware.auth import auth_required, customer_only
from src.services.refund_service import refund_case_service
from src.models.refund_case import RefundCase
from src.middleware.exceptions import AppException
from pydantic import BaseModel

router = APIRouter()


# Request/Response Models
class RefundRequestCreate(BaseModel):
    products: List[dict]  # Array of {product_id, quantity}


class RefundCaseResponse(BaseModel):
    id: str
    support_case_id: str
    customer_id: str
    order_id: str
    status: str
    eligibility_status: str
    total_refund_amount: float
    created_at: str
    processed_at: Optional[str] = None
    rejection_reason: Optional[str] = None
    agent_id: Optional[str] = None
    products: List[dict]
    history: List[dict]

    @classmethod
    def from_entity(cls, entity: RefundCase):
        return cls(
            id=entity.id,
            support_case_id=entity.support_case_id,
            customer_id=entity.customer_id,
            order_id=entity.order_id,
            status=entity.status.value,
            eligibility_status=entity.eligibility_status.value,
            total_refund_amount=entity.total_refund_amount,
            created_at=entity.created_at.isoformat(),
            processed_at=entity.processed_at.isoformat()
            if entity.processed_at
            else None,
            rejection_reason=entity.rejection_reason,
            agent_id=entity.agent_id,
            products=entity.products or [],
            history=entity.history or [],
        )


class RefundCaseListResponse(BaseModel):
    cases: List[RefundCaseResponse]
    count: int


# Endpoints
@router.post(
    "/support/cases/{case_id}/refunds",
    summary="Request refund from support case",
    description="Create a refund request from an existing support case",
    response_model=RefundCaseResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_refund_request(
    case_id: str, request: RefundRequestCreate, token_data=Depends(customer_only)
):
    """Create a refund request from support case"""
    try:
        # Extract user_id from token_data
        user_id = (
            token_data.user_id
            if hasattr(token_data, "user_id")
            else str(token_data.get("user_id"))
        )

        # Get delivery dates (this would come from order service in real implementation)
        # For now, we'll use mock data
        delivery_dates = {}
        for product in request.products:
            # Mock delivery date (10 days ago for testing)
            delivery_date = (datetime.utcnow() - timedelta(days=10)).isoformat()
            delivery_dates[product["product_id"]] = delivery_date

        refund_case = refund_case_service.create_refund_request(
            support_case_id=case_id,
            customer_id=user_id,
            products=request.products,
            delivery_dates=delivery_dates,
        )
        return RefundCaseResponse.from_entity(refund_case)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/cases",
    summary="Get all refund cases for current customer",
    description="Returns list of refund cases for the authenticated customer",
    response_model=RefundCaseListResponse,
)
async def get_customer_refund_cases(
    status: Optional[str] = Query(
        None, description="Filter by status (Pending/Approved/Rejected/Completed)"
    ),
    skip: int = Query(0, description="Pagination offset"),
    limit: int = Query(100, description="Pagination limit"),
    token_data=Depends(customer_only),
):
    """Get all refund cases for the authenticated customer"""
    try:
        # Extract user_id from token_data
        user_id = (
            token_data.user_id
            if hasattr(token_data, "user_id")
            else str(token_data.get("user_id"))
        )

        cases = refund_case_service.get_customer_refund_cases(user_id, status)

        # Apply pagination
        paginated_cases = cases[skip : skip + limit]

        return RefundCaseListResponse(
            cases=[RefundCaseResponse.from_entity(case) for case in paginated_cases],
            count=len(paginated_cases),
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/cases/{refund_id}",
    summary="Get refund case details",
    description="Get detailed information about a specific refund case",
    response_model=RefundCaseResponse,
)
async def get_refund_case(refund_id: str, token_data=Depends(customer_only)):
    """Get refund case details"""
    try:
        # Extract user_id from token_data
        user_id = (
            token_data.user_id
            if hasattr(token_data, "user_id")
            else str(token_data.get("user_id"))
        )

        refund_case = refund_case_service.get_refund_case(refund_id, user_id)
        return RefundCaseResponse.from_entity(refund_case)
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/support/cases/{case_id}/refunds",
    summary="Get refund cases for support case",
    description="Get all refund cases associated with a support case",
    response_model=RefundCaseListResponse,
)
async def get_refund_cases_by_support_case(
    case_id: str, token_data=Depends(customer_only)
):
    """Get refund cases for a specific support case"""
    try:
        # Extract user_id from token_data
        user_id = (
            token_data.user_id
            if hasattr(token_data, "user_id")
            else str(token_data.get("user_id"))
        )

        cases = refund_case_service.get_refund_cases_by_support_case(case_id, user_id)

        return RefundCaseListResponse(
            cases=[RefundCaseResponse.from_entity(case) for case in cases],
            count=len(cases),
        )
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)


@router.get(
    "/cases/{case_id}/eligibility",
    summary="Check refund eligibility",
    description="Check if products are eligible for refund based on 14-day window",
    response_model=dict,
)
async def check_refund_eligibility(
    case_id: str,
    product_ids: List[str] = Query([], description="Product IDs to check"),
    token_data=Depends(customer_only),
):
    """Check refund eligibility for products"""
    try:
        # Extract user_id from token_data
        user_id = (
            token_data.user_id
            if hasattr(token_data, "user_id")
            else str(token_data.get("user_id"))
        )

        # Get delivery dates (mock data for now)
        delivery_dates = {}
        for product_id in product_ids:
            delivery_dates[product_id] = (
                datetime.utcnow() - timedelta(days=10)
            ).isoformat()

        eligibility = refund_case_service.validate_refund_eligibility(
            case_id, user_id, product_ids, delivery_dates
        )
        return eligibility
    except AppException as e:
        raise HTTPException(status_code=e.status_code, detail=e.message)
