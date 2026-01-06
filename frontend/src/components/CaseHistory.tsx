import React from 'react'
import { SupportCase } from '../../types/supportTypes'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../Button'

interface CaseHistoryProps {
  supportCases: SupportCase[]
  refundCases: RefundCase[]
  onViewSupportCase: (caseId: string) => void
  onViewRefundCase: (refundId: string) => void
}

export const CaseHistory: React.FC<CaseHistoryProps> = ({ 
  supportCases, 
  refundCases, 
  onViewSupportCase, 
  onViewRefundCase 
}) => {
  // Combine and sort all cases by date (newest first)
  const allCases = [...supportCases, ...refundCases]
    .map(item => ({
      ...item,
      type: 'supportCases' in item ? 'support' : 'refund',
      date: item.createdAt
    }))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  if (allCases.length === 0) {
    return (
      <div className="case-history empty">
        <p>No case history found.</p>
      </div>
    )
  }

  return (
    <div className="case-history">
      <h2>Your Case History</h2>
      <p className="history-summary">
        {supportCases.length} support case(s), {refundCases.length} refund case(s)
      </p>

      <div className="history-timeline">
        {allCases.map((item) => (
          <div key={item.id} className="history-item">
            <div className="history-date">
              <span className="date-text">
                {new Date(item.date).toLocaleDateString()}
              </span>
              <span className="time-text">
                {new Date(item.date).toLocaleTimeString()}
              </span>
            </div>

            <div className="history-content">
              <div className="history-header">
                <span className={`item-type ${item.type}`}>
                  {item.type === 'support' ? 'Support Case' : 'Refund Case'}
                </span>
                <span className={`status-badge ${item.status.toLowerCase()}`}>
                  {item.status}
                </span>
              </div>

              <div className="history-details">
                {item.type === 'support' ? (
                  <>
                    <p className="case-id">
                      Support Case: {item.id.substring(0, 8)}...
                    </p>
                    <p className="order-info">
                      Order: {item.orderId}
                    </p>
                    {item.issueDescription && (
                      <p className="issue-description">
                        Issue: {item.issueDescription.substring(0, 100)}{item.issueDescription.length > 100 ? '...' : ''}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="case-id">
                      Refund Case: {item.id.substring(0, 8)}...
                    </p>
                    <p className="support-case">
                      Support Case: {item.supportCaseId.substring(0, 8)}...
                    </p>
                    <p className="order-info">
                      Order: {item.orderId}
                    </p>
                    <p className="amount">
                      Amount: ${item.totalRefundAmount.toFixed(2)}
                    </p>
                    <p className="eligibility">
                      Eligibility: {item.eligibilityStatus}
                    </p>
                  </>
                )}
              </div>

              <div className="history-actions">
                <Button
                  variant="secondary"
                  onClick={() => item.type === 'support' ? onViewSupportCase(item.id) : onViewRefundCase(item.id)}
                  size="small"
                >
                  View Details
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}