from sqlalchemy import Column, String, Text, DateTime, JSON, Enum, Float, ForeignKey
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime, timedelta
import enum
import uuid
from typing import Optional, List, Dict, Any

Base = declarative_base()


class RefundCaseStatus(str, enum.Enum):
    PENDING = "Pending"
    APPROVED = "Approved"
    REJECTED = "Rejected"
    COMPLETED = "Completed"


class EligibilityStatus(str, enum.Enum):
    ELIGIBLE = "Eligible"
    PARTIALLY_ELIGIBLE = "Partially Eligible"
    INELIGIBLE = "Ineligible"


class RefundCase(Base):
    __tablename__ = "refund_cases"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    support_case_id = Column(String, ForeignKey("support_cases.id"), index=True)
    customer_id = Column(String, index=True)
    order_id = Column(String, index=True)
    status = Column(Enum(RefundCaseStatus), default=RefundCaseStatus.PENDING)
    eligibility_status = Column(Enum(EligibilityStatus))
    total_refund_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)
    processed_at = Column(DateTime, nullable=True)
    rejection_reason = Column(Text, nullable=True)
    agent_id = Column(String, nullable=True)
    products = Column(
        JSON
    )  # Array of {product_id, quantity, name, price, refund_amount, delivery_date, eligibility}
    history = Column(JSON)  # Array of {action, timestamp, user_id, details}

    # Relationship to support case
    support_case = relationship("SupportCase", backref="refund_cases")

    def __repr__(self):
        return f"<RefundCase {self.id} - {self.status}>"

    def add_history_entry(self, action: str, user_id: str, details: Dict[str, Any]):
        """Add a history entry to the refund case"""
        current_history = self.history or []
        current_history.append(
            {
                "action": action,
                "timestamp": datetime.utcnow().isoformat(),
                "user_id": user_id,
                "details": details,
            }
        )
        self.history = current_history

    def approve_refund(self, agent_id: str):
        """Approve the refund case"""
        if self.status != RefundCaseStatus.PENDING:
            raise ValueError("Only pending refunds can be approved")

        self.status = RefundCaseStatus.APPROVED
        self.processed_at = datetime.utcnow()
        self.agent_id = agent_id
        self.add_history_entry("refund_approved", agent_id, {"status": "Approved"})

    def reject_refund(self, agent_id: str, reason: str):
        """Reject the refund case"""
        if self.status != RefundCaseStatus.PENDING:
            raise ValueError("Only pending refunds can be rejected")

        self.status = RefundCaseStatus.REJECTED
        self.processed_at = datetime.utcnow()
        self.agent_id = agent_id
        self.rejection_reason = reason
        self.add_history_entry(
            "refund_rejected", agent_id, {"status": "Rejected", "reason": reason}
        )

    def complete_refund(self):
        """Mark refund as completed (after payment processing)"""
        if self.status != RefundCaseStatus.APPROVED:
            raise ValueError("Only approved refunds can be completed")

        self.status = RefundCaseStatus.COMPLETED
        self.add_history_entry("refund_completed", "system", {"status": "Completed"})

    def calculate_eligibility(self, delivery_dates: Dict[str, str]) -> Dict[str, Any]:
        """Calculate refund eligibility based on 14-day window from delivery"""
        today = datetime.utcnow().date()
        eligible_products = []
        ineligible_products = []

        for product in self.products:
            product_id = product["product_id"]
            delivery_date_str = delivery_dates.get(product_id)

            if delivery_date_str:
                delivery_date = datetime.fromisoformat(delivery_date_str).date()
                days_since_delivery = (today - delivery_date).days

                if days_since_delivery <= 14:
                    eligible_products.append(
                        {
                            "product_id": product_id,
                            "eligible": True,
                            "delivery_date": delivery_date_str,
                            "days_since_delivery": days_since_delivery,
                            "reason": "Within 14-day refund window",
                        }
                    )
                else:
                    ineligible_products.append(
                        {
                            "product_id": product_id,
                            "eligible": False,
                            "delivery_date": delivery_date_str,
                            "days_since_delivery": days_since_delivery,
                            "reason": f"Exceeds 14-day refund window by {days_since_delivery - 14} days",
                        }
                    )
            else:
                ineligible_products.append(
                    {
                        "product_id": product_id,
                        "eligible": False,
                        "reason": "No delivery date available",
                    }
                )

        # Determine overall eligibility status
        if len(ineligible_products) == 0:
            eligibility_status = EligibilityStatus.ELIGIBLE
        elif len(eligible_products) > 0:
            eligibility_status = EligibilityStatus.PARTIALLY_ELIGIBLE
        else:
            eligibility_status = EligibilityStatus.INELIGIBLE

        self.eligibility_status = eligibility_status

        return {
            "eligibility_status": eligibility_status.value,
            "eligible_products": eligible_products,
            "ineligible_products": ineligible_products,
            "eligible_count": len(eligible_products),
            "ineligible_count": len(ineligible_products),
        }

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for API responses"""
        return {
            "id": self.id,
            "support_case_id": self.support_case_id,
            "customer_id": self.customer_id,
            "order_id": self.order_id,
            "status": self.status.value,
            "eligibility_status": self.eligibility_status.value,
            "total_refund_amount": self.total_refund_amount,
            "created_at": self.created_at.isoformat(),
            "processed_at": self.processed_at.isoformat()
            if self.processed_at
            else None,
            "rejection_reason": self.rejection_reason,
            "agent_id": self.agent_id,
            "products": self.products or [],
            "history": self.history or [],
        }

    @classmethod
    def create_from_support_case(
        cls,
        support_case_id: str,
        customer_id: str,
        order_id: str,
        products: List[Dict[str, Any]],
        delivery_dates: Dict[str, str],
    ) -> "RefundCase":
        """Factory method to create RefundCase from support case"""
        # Calculate refund amounts and eligibility
        refund_products = []
        total_amount = 0.0

        for product in products:
            product_id = product["product_id"]
            quantity = product["quantity"]
            price = product.get("price", 0.0)

            refund_amount = price * quantity
            total_amount += refund_amount

            # Get delivery date for eligibility calculation
            delivery_date = delivery_dates.get(product_id)

            refund_products.append(
                {
                    "product_id": product_id,
                    "quantity": quantity,
                    "name": product.get("name", ""),
                    "price": price,
                    "refund_amount": refund_amount,
                    "delivery_date": delivery_date,
                    "eligibility": "Eligible",  # Will be calculated later
                }
            )

        refund_case = cls(
            support_case_id=support_case_id,
            customer_id=customer_id,
            order_id=order_id,
            products=refund_products,
            total_refund_amount=total_amount,
        )

        # Calculate eligibility
        eligibility_result = refund_case.calculate_eligibility(delivery_dates)

        refund_case.add_history_entry(
            "refund_requested",
            customer_id,
            {
                "initial_status": "Pending",
                "eligibility": eligibility_result["eligibility_status"],
            },
        )

        return refund_case
