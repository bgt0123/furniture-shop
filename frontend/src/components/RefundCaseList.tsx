import React from 'react'
import { Link } from 'react-router-dom'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../Button'

interface RefundCaseListProps {
  cases: RefundCase[]
  onViewDetails: (refundId: string) => void
  token: string
  onRequestRefund: (caseId: string) => void
}

export const RefundCaseList: React.FC<RefundCaseListProps> = ({ cases, onViewDetails, token, onRequestRefund }) => {
  if (cases.length === 0) {
    return (
      <div className="refund-case-list empty">
        <p>No refund cases found.</p>
        <Link to="/support">
          <Button variant="primary">View Support Cases</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="refund-case-list">
      <h2>Your Refund Cases</h2>

      <div className="case-grid">
        {cases.map((refundCase) => (
          <div key={refundCase.id} className="case-card">
            <div className="case-header">
              <span className={`status-badge ${refundCase.status.toLowerCase()}`}>
                {refundCase.status}
              </span>
              <span className="case-id">Refund #{refundCase.id.substring(0, 8)}</span>
            </div>
            
            <div className="case-body">
              <p className="support-case">Support Case: {refundCase.supportCaseId.substring(0, 8)}</p>
              <p className="order-info">Order: {refundCase.orderId}</p>
              <p className="created-at">Requested: {new Date(refundCase.createdAt).toLocaleString()}</p>
              <p className="eligibility">
                Eligibility: <span className={`eligibility-${refundCase.eligibilityStatus.toLowerCase()}`}>
                  {refundCase.eligibilityStatus}
                </span>
              </p>
              <p className="amount">Amount: ${refundCase.totalRefundAmount.toFixed(2)}</p>
              <p className="products-count">Products: {refundCase.products?.length || 0}</p>
            </div>
            
            <div className="case-actions">
              <Button 
                variant="secondary" 
                onClick={() => onViewDetails(refundCase.id)}
                size="small"
              >
                View Details
              </Button>
              
              {refundCase.status === 'Rejected' && (
                <Button
                  variant="primary"
                  onClick={() => onRequestRefund(refundCase.supportCaseId)}
                  size="small"
                >
                  Request New Refund
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}