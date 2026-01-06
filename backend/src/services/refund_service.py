from typing import Optional, List, Dict, Any
from src.repositories.refund_repository import refund_case_repository
from src.repositories.support_repository import support_case_repository
from src.models.refund_case import RefundCase
from src.middleware.exceptions import (
    NotFoundException,
    BusinessRuleException,
    ValidationException,
)
from src.middleware.auth import auth_required, customer_only
from src.cache import cache
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)


class RefundCaseService:
    def __init__(self):
        self.repository = refund_case_repository
        self.support_repository = support_case_repository

    def create_refund_request(
        self,
        support_case_id: str,
        customer_id: str,
        products: List[Dict[str, Any]],
        delivery_dates: Dict[str, str],
    ) -> RefundCase:
        """Create a refund request from a support case"""
        try:
            # Validate the refund request
            self.repository.validate_refund_request(
                support_case_id, customer_id, products
            )

            # Check if support case exists and belongs to customer
            support_case = self.support_repository.find_by_id(support_case_id)
            if not support_case:
                raise NotFoundException("SupportCase", f"ID {support_case_id}")

            if support_case.customer_id != customer_id:
                raise BusinessRuleException(
                    "Access denied: Customer does not own this support case"
                )

            if support_case.status != "Open":
                raise BusinessRuleException(
                    "Refund requests can only be created from open support cases"
                )

            # Check for existing refund requests on the same products
            conflict_check = self.repository.check_existing_refunds(
                support_case_id, [p["product_id"] for p in products]
            )
            if conflict_check["has_conflicts"]:
                raise BusinessRuleException(
                    "Some products already have active refund requests",
                    {"conflicts": conflict_check["conflicting_refunds"]},
                )

            # Create the refund case
            refund_case = self.repository.create_refund_case(
                support_case_id,
                customer_id,
                support_case.order_id,
                products,
                delivery_dates,
            )

            # Clear cache
            cache.delete(f"refund_cases:{customer_id}")
            cache.delete(f"support_case:{support_case_id}")

            logger.info(f"Refund request created: {refund_case.id}")
            return refund_case
        except Exception as e:
            logger.error(f"Error creating refund request: {str(e)}")
            raise

    def get_refund_case(self, refund_id: str, customer_id: str) -> RefundCase:
        """Get refund case by ID with customer access control"""
        try:
            refund_case = self.repository.find_by_id(refund_id)
            if not refund_case:
                raise NotFoundException("RefundCase", f"ID {refund_id}")

            # Check if customer has access to this refund case
            if refund_case.customer_id != customer_id:
                raise BusinessRuleException(
                    "Access denied: Customer does not own this refund case"
                )

            return refund_case
        except Exception as e:
            logger.error(f"Error getting refund case {refund_id}: {str(e)}")
            raise

    def get_customer_refund_cases(
        self, customer_id: str, status: Optional[str] = None
    ) -> List[RefundCase]:
        """Get all refund cases for a customer"""
        try:
            cache_key = f"refund_cases:{customer_id}:{status or 'all'}"

            # Try to get from cache
            cached_cases = cache.get(cache_key)
            if cached_cases:
                return cached_cases

            # Get from database
            cases = self.repository.find_by_customer(customer_id)

            # Filter by status if provided
            if status:
                cases = [case for case in cases if case.status == status]

            # Cache the results
            cache.set(cache_key, cases)

            return cases
        except Exception as e:
            logger.error(
                f"Error getting refund cases for customer {customer_id}: {str(e)}"
            )
            raise

    def get_refund_cases_by_support_case(
        self, support_case_id: str, customer_id: str
    ) -> List[RefundCase]:
        """Get refund cases for a specific support case"""
        try:
            # Verify customer has access to the support case
            support_case = self.support_repository.find_by_id(support_case_id)
            if not support_case or support_case.customer_id != customer_id:
                raise BusinessRuleException(
                    "Access denied: Customer does not own this support case"
                )

            return self.repository.find_by_support_case(support_case_id)
        except Exception as e:
            logger.error(
                f"Error getting refund cases for support case {support_case_id}: {str(e)}"
            )
            raise

    def validate_refund_eligibility(
        self,
        support_case_id: str,
        customer_id: str,
        product_ids: List[str],
        delivery_dates: Dict[str, str],
    ) -> Dict[str, Any]:
        """Validate refund eligibility based on 14-day window"""
        try:
            # Verify customer has access to the support case
            support_case = self.support_repository.find_by_id(support_case_id)
            if not support_case or support_case.customer_id != customer_id:
                raise BusinessRuleException(
                    "Access denied: Customer does not own this support case"
                )

            # Get products from support case
            support_case_products = {p["product_id"]: p for p in support_case.products}

            # Validate requested products
            eligible_products = []
            ineligible_products = []
            today = datetime.utcnow().date()

            for product_id in product_ids:
                if product_id not in support_case_products:
                    ineligible_products.append(
                        {
                            "product_id": product_id,
                            "eligible": False,
                            "reason": "Product not found in support case",
                        }
                    )
                    continue

                product = support_case_products[product_id]
                delivery_date_str = delivery_dates.get(product_id)

                if not delivery_date_str:
                    ineligible_products.append(
                        {
                            "product_id": product_id,
                            "eligible": False,
                            "reason": "No delivery date available for product",
                        }
                    )
                    continue

                try:
                    delivery_date = datetime.fromisoformat(delivery_date_str).date()
                    days_since_delivery = (today - delivery_date).days

                    if days_since_delivery <= 14:
                        eligible_products.append(
                            {
                                "product_id": product_id,
                                "quantity": product["quantity"],
                                "price": product.get("price", 0),
                                "delivery_date": delivery_date_str,
                                "days_since_delivery": days_since_delivery,
                                "eligible": True,
                                "reason": "Within 14-day refund window",
                            }
                        )
                    else:
                        ineligible_products.append(
                            {
                                "product_id": product_id,
                                "quantity": product["quantity"],
                                "price": product.get("price", 0),
                                "delivery_date": delivery_date_str,
                                "days_since_delivery": days_since_delivery,
                                "eligible": False,
                                "reason": f"Exceeds 14-day refund window by {days_since_delivery - 14} days",
                            }
                        )
                except Exception:
                    ineligible_products.append(
                        {
                            "product_id": product_id,
                            "eligible": False,
                            "reason": "Invalid delivery date format",
                        }
                    )

            # Determine overall eligibility
            eligibility_status = (
                "Eligible"
                if len(ineligible_products) == 0
                else "Partially Eligible"
                if len(eligible_products) > 0
                else "Ineligible"
            )

            return {
                "eligibility_status": eligibility_status,
                "eligible_products": eligible_products,
                "ineligible_products": ineligible_products,
                "all_eligible": len(ineligible_products) == 0,
                "total_eligible_amount": sum(
                    p["price"] * p["quantity"] for p in eligible_products
                ),
                "total_ineligible_amount": sum(
                    p["price"] * p["quantity"] for p in ineligible_products
                ),
            }
        except Exception as e:
            logger.error(f"Error validating refund eligibility: {str(e)}")
            raise


# Singleton instance
refund_case_service = RefundCaseService()
