import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { refundApi } from '../../services/refundApi'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../Button'

interface RefundCaseDetailProps {
  refundId: string
  token: string
  onBack: () => void
}

export const RefundCaseDetail: React.FC<RefundCaseDetailProps> = ({ refundId, token, onBack }) => {
  const [refundCase, setRefundCase] = useState<RefundCase | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchRefundDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        refundApi.setAuthToken(token)
        const response = await refundApi.getRefundCase(refundId)
        setRefundCase(response.data)
      } catch (err) {
        console.error('Error fetching refund details:', err)
        setError('Failed to load refund details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (refundId) {
      fetchRefundDetails()
    }
  }, [refundId, token])

  if (isLoading) {
    return <div className="loading">Loading refund details...</div>
  }

  if (error) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <Button variant="secondary" onClick={onBack}>
          Back to List
        </Button>
      </div>
    )
  }

  if (!refundCase) {
    return (
      <div className="not-found">
        <h3>Refund Case Not Found</h3>
        <p>The requested refund case does not exist or you don't have permission to view it.</p>
        <Button variant="secondary" onClick={onBack}>
          Back to List
        </Button>
      </div>
    )
  }

  return (
    <div className="refund-case-detail">
      <div className="case-header">
        <div className="header-left">
          <h2>Refund Case #{refundCase.id.substring(0, 8)}</h2>
          <span className={`status-badge ${refundCase.status.toLowerCase()}`}>
            {refundCase.status}
          </span>
        </div>
        
        <div className="header-right">
          <p>Created: {new Date(refundCase.createdAt).toLocaleString()}</p>
          {refundCase.processedAt && (
            <p>Processed: {new Date(refundCase.processedAt).toLocaleString()}</p>
          )}
        </div>
      </div>

      <div className="case-body">
        <div className="section">
          <h3>Refund Information</h3>
          <p><strong>Support Case:</strong> {refundCase.supportCaseId.substring(0, 8)}</p>
          <p><strong>Order:</strong> {refundCase.orderId}</p>
          <p><strong>Status:</strong> {refundCase.status}</p>
          <p><strong>Eligibility:</strong> {refundCase.eligibilityStatus}</p>
          <p><strong>Total Amount:</strong> ${refundCase.totalRefundAmount.toFixed(2)}</p>
        </div>

        <div className="section">
          <h3>Products</h3>
          <div className="products-list">
            {refundCase.products && refundCase.products.length > 0 ? (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Name</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Refund Amount</th>
                    <th>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {refundCase.products.map((product, index) => (
                    <tr key={index}>
                      <td>{product.productId}</td>
                      <td>{product.name || 'N/A'}</td>
                      <td>{product.quantity}</td>
                      <td>${product.price?.toFixed(2) || '0.00'}</td>
                      <td>${product.refundAmount?.toFixed(2) || '0.00'}</td>
                      <td>{product.eligibility || 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No products specified</p>
            )}
          </div>
        </div>

        {refundCase.rejectionReason && (
          <div className="section rejection-section">
            <h3>Rejection Reason</h3>
            <p>{refundCase.rejectionReason}</p>
          </div>
        )}

        {refundCase.agentId && (
          <div className="section">
            <h3>Processed By</h3>
            <p>Agent ID: {refundCase.agentId}</p>
          </div>
        )}

        <div className="section">
          <h3>Refund History</h3>
          <div className="history-list">
            {refundCase.history && refundCase.history.length > 0 ? (
              <ul>
                {refundCase.history.map((entry, index) => (
                  <li key={index} className="history-entry">
                    <div className="history-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </div>
                    <div className="history-action">
                      {entry.action}
                    </div>
                    {entry.details && (
                      <div className="history-details">
                        {JSON.stringify(entry.details)}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No history entries</p>
            )}
          </div>
        </div>

        <div className="section">
          <h3>Refund Status Explanation</h3>
          <div className="status-explanation">
            {refundCase.status === 'Pending' && (
              <p>Your refund request has been submitted and is awaiting review by our support team. This typically takes 1-2 business days.</p>
            )}
            
            {refundCase.status === 'Approved' && (
              <p>Your refund request has been approved. The refund will be processed and the amount will be credited back to your original payment method within 3-5 business days.</p>
            )}
            
            {refundCase.status === 'Rejected' && (
              <p>Unfortunately, your refund request was not approved. You can request a new refund if you have additional information or if your circumstances have changed.</p>
            )}
            
            {refundCase.status === 'Completed' && (
              <p>Your refund has been successfully processed. The refund amount should now be visible in your original payment method.</p>
            )}
          </div>
        </div>
      </div>

      <div className="case-actions">
        <Button variant="secondary" onClick={onBack}>
          Back to List
        </Button>
        
        {refundCase.status === 'Rejected' && (
          <Link to={`/refunds/request/${refundCase.supportCaseId}`}>
            <Button variant="primary">
              Request New Refund
            </Button>
          </Link>
        )}
      </div>
    </div>
  )
}