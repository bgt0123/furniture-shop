from typing import Optional, List, Dict, Any
from src.repositories.base_repository import BaseRepository
from src.models.refund_case import RefundCase
from src.middleware.exceptions import (
    NotFoundException,
    BusinessRuleException,
    ValidationException,
)
from datetime import datetime
import uuid


class RefundCaseRepository(BaseRepository[RefundCase]):
    def __init__(self):
        super().__init__(RefundCase)

    def create_refund_case(
        self,
        support_case_id: str,
        customer_id: str,
        order_id: str,
        products: List[Dict[str, Any]],
        delivery_dates: Dict[str, str],
    ) -> RefundCase:
        """Create a new refund case from support case"""
        refund_case = RefundCase.create_from_support_case(
            support_case_id, customer_id, order_id, products, delivery_dates
        )
        return self.create(refund_case)

    def find_by_customer(
        self, customer_id: str, skip: int = 0, limit: int = 100
    ) -> List[RefundCase]:
        """Find refund cases by customer ID"""
        return self.find_all_by_field("customer_id", customer_id, skip, limit)

    def find_by_support_case(self, support_case_id: str) -> List[RefundCase]:
        """Find refund cases by support case ID"""
        return self.find_all_by_field("support_case_id", support_case_id)

    def find_by_status(
        self, status: str, skip: int = 0, limit: int = 100
    ) -> List[RefundCase]:
        """Find refund cases by status"""
        return self.find_all_by_field("status", status, skip, limit)

    def approve_refund(self, refund_id: str, agent_id: str) -> RefundCase:
        """Approve a refund case"""
        refund_case = self.find_by_id(refund_id)
        if not refund_case:
            raise NotFoundException("RefundCase", f"ID {refund_id}")

        if refund_case.status != "Pending":
            raise BusinessRuleException("Only pending refunds can be approved")

        refund_case.approve_refund(agent_id)
        return self.update(refund_id, refund_case.to_dict())

    def reject_refund(self, refund_id: str, agent_id: str, reason: str) -> RefundCase:
        """Reject a refund case"""
        refund_case = self.find_by_id(refund_id)
        if not refund_case:
            raise NotFoundException("RefundCase", f"ID {refund_id}")

        if refund_case.status != "Pending":
            raise BusinessRuleException("Only pending refunds can be rejected")

        refund_case.reject_refund(agent_id, reason)
        return self.update(refund_id, refund_case.to_dict())

    def complete_refund(self, refund_id: str) -> RefundCase:
        """Mark refund as completed"""
        refund_case = self.find_by_id(refund_id)
        if not refund_case:
            raise NotFoundException("RefundCase", f"ID {refund_id}")

        if refund_case.status != "Approved":
            raise BusinessRuleException("Only approved refunds can be completed")

        refund_case.complete_refund()
        return self.update(refund_id, refund_case.to_dict())

    def validate_refund_request(
        self, support_case_id: str, customer_id: str, products: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """Validate refund request data"""
        if not support_case_id or not customer_id:
            raise ValidationException("Support case ID and customer ID are required")

        if not products or len(products) == 0:
            raise ValidationException(
                "At least one product must be specified for refund"
            )

        for product in products:
            if (
                not product.get("product_id")
                or not product.get("quantity")
                or product["quantity"] < 1
            ):
                raise ValidationException(
                    "Each product must have a valid product_id and quantity >= 1"
                )

        return {"valid": True, "message": "Refund request data is valid"}

    def check_existing_refunds(
        self, support_case_id: str, product_ids: List[str]
    ) -> Dict[str, Any]:
        """Check if products already have refund requests"""
        existing_refunds = self.find_by_support_case(support_case_id)

        conflicting_refunds = []
        for refund_case in existing_refunds:
            if refund_case.status in ["Pending", "Approved"]:
                for product in refund_case.products:
                    if product["product_id"] in product_ids:
                        conflicting_refunds.append(
                            {
                                "refund_id": refund_case.id,
                                "product_id": product["product_id"],
                                "status": refund_case.status,
                            }
                        )

        if conflicting_refunds:
            return {
                "has_conflicts": True,
                "conflicting_refunds": conflicting_refunds,
                "message": "Some products already have active refund requests",
            }

        return {
            "has_conflicts": False,
            "message": "No conflicting refund requests found",
        }


# Singleton instance
refund_case_repository = RefundCaseRepository()
