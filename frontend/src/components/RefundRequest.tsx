import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { refundApi } from '../../services/refundApi'
import { supportApi } from '../../services/supportApi'
import { Button } from '../Button'
import { SupportCase } from '../../types/supportTypes'

interface RefundRequestProps {
  token: string
}

export const RefundRequest: React.FC<RefundRequestProps> = ({ token }) => {
  const { caseId } = useParams<{ caseId: string }>()
  const [supportCase, setSupportCase] = useState<SupportCase | null>(null)
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set())
  const [eligibility, setEligibility] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchCaseDetails = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        // Get support case details
        supportApi.setAuthToken(token)
        const caseResponse = await supportApi.getSupportCase(caseId || '')
        setSupportCase(caseResponse.data)
        
        // Check eligibility for all products by default
        if (caseResponse.data.products && caseResponse.data.products.length > 0) {
          const productIds = caseResponse.data.products.map(p => p.productId)
          checkEligibility(productIds)
        }
      } catch (err) {
        console.error('Error fetching case details:', err)
        setError('Failed to load case details. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (caseId) {
      fetchCaseDetails()
    }
  }, [caseId, token])

  const checkEligibility = async (productIds: string[]) => {
    try {
      setIsLoading(true)
      setError(null)
      
      refundApi.setAuthToken(token)
      const response = await refundApi.checkRefundEligibility(caseId || '', productIds)
      setEligibility(response.data)
    } catch (err) {
      console.error('Error checking eligibility:', err)
      setError('Failed to check refund eligibility. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleProductSelection = (productId: string) => {
    const newSelection = new Set(selectedProducts)
    if (newSelection.has(productId)) {
      newSelection.delete(productId)
    } else {
      newSelection.add(productId)
    }
    setSelectedProducts(newSelection)
    
    // Check eligibility for selected products
    if (newSelection.size > 0) {
      checkEligibility(Array.from(newSelection))
    } else {
      setEligibility(null)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedProducts.size === 0) {
      setError('Please select at least one product for refund.')
      return
    }
    
    if (!eligibility || !eligibility.all_eligible) {
      setError('Some selected products are not eligible for refund. Please review eligibility.')
      return
    }
    
    setIsSubmitting(true)
    setError(null)
    setSuccess(null)
    
    try {
      // Prepare refund request
      const products = Array.from(selectedProducts).map(productId => {
        const product = supportCase?.products?.find(p => p.productId === productId)
        return {
          product_id: productId,
          quantity: product?.quantity || 1
        }
      })
      
      // Create refund request
      refundApi.setAuthToken(token)
      const response = await refundApi.createRefundRequest(caseId || '', products)
      
      setSuccess('Refund request created successfully!')
      
      // Navigate to refund details
      setTimeout(() => {
        navigate(`/refunds/${response.data.id}`)
      }, 2000)
    } catch (err) {
      console.error('Error creating refund request:', err)
      setError('Failed to create refund request. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading && !supportCase) {
    return <div className="loading">Loading refund request form...</div>
  }

  if (error && !supportCase) {
    return (
      <div className="error-container">
        <h3>Error</h3>
        <p>{error}</p>
        <Button variant="secondary" onClick={() => navigate('/support')}>
          Back to Support Cases
        </Button>
      </div>
    )
  }

  if (!supportCase) {
    return (
      <div className="not-found">
        <h3>Support Case Not Found</h3>
        <p>The requested support case does not exist or you don't have permission to view it.</p>
        <Button variant="secondary" onClick={() => navigate('/support')}>
          Back to Support Cases
        </Button>
      </div>
    )
  }

  return (
    <div className="refund-request">
      <div className="request-header">
        <h2>Request Refund</h2>
        <p>Support Case #{supportCase.id.substring(0, 8)}</p>
        <p>Order: {supportCase.orderId}</p>
      </div>

      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="products-section">
          <h3>Select Products for Refund</h3>
          <p>Select the products you want to request a refund for:</p>
          
          <div className="products-list">
            {supportCase.products && supportCase.products.length > 0 ? (
              <table className="product-table">
                <thead>
                  <tr>
                    <th>Select</th>
                    <th>Product</th>
                    <th>Quantity</th>
                    <th>Price</th>
                    <th>Eligibility</th>
                  </tr>
                </thead>
                <tbody>
                  {supportCase.products.map((product) => (
                    <tr key={product.productId}>
                      <td>
                        <input
                          type="checkbox"
                          checked={selectedProducts.has(product.productId)}
                          onChange={() => handleProductSelection(product.productId)}
                          disabled={isLoading}
                        />
                      </td>
                      <td>
                        <div className="product-info">
                          <strong>{product.productId}</strong>
                          {product.name && <span> - {product.name}</span>}
                        </div>
                      </td>
                      <td>{product.quantity}</td>
                      <td>${product.price?.toFixed(2) || '0.00'}</td>
                      <td>
                        {eligibility ? (
                          eligibility.eligible_products.some((p: any) => p.product_id === product.productId) ? (
                            <span className="eligible-badge">Eligible</span>
                          ) : eligibility.ineligible_products.some((p: any) => p.product_id === product.productId) ? (
                            <span className="ineligible-badge">Not Eligible</span>
                          ) : (
                            <span className="unknown-badge">Checking...</span>
                          )
                        ) : (
                          <span className="unknown-badge">Select to check</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p>No products found in this support case.</p>
            )}
          </div>
        </div>

        {eligibility && (
          <div className="eligibility-summary">
            <h3>Refund Eligibility Summary</h3>
            <p><strong>Status:</strong> {eligibility.eligibility_status}</p>
            
            {eligibility.eligible_products && eligibility.eligible_products.length > 0 && (
              <div className="eligible-section">
                <h4>Eligible Products ({eligibility.eligible_products.length}):</h4>
                <p>Total eligible amount: ${eligibility.total_eligible_amount?.toFixed(2) || '0.00'}</p>
                <ul>
                  {eligibility.eligible_products.map((product: any) => (
                    <li key={product.product_id}>
                      {product.product_id} - ${(product.price * product.quantity).toFixed(2)} 
                      ({product.reason})
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {eligibility.ineligible_products && eligibility.ineligible_products.length > 0 && (
              <div className="ineligible-section">
                <h4>Ineligible Products ({eligibility.ineligible_products.length}):</h4>
                <p>Total ineligible amount: ${eligibility.total_ineligible_amount?.toFixed(2) || '0.00'}</p>
                <ul>
                  {eligibility.ineligible_products.map((product: any) => (
                    <li key={product.product_id}>
                      {product.product_id} - ${(product.price * product.quantity).toFixed(2)} 
                      ({product.reason})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="refund-terms">
          <h3>Refund Policy</h3>
          <p>Please review our refund policy before submitting your request:</p>
          <ul>
            <li>Refunds are only available for products within 14 days of delivery</li>
            <li>Products must be in original condition with all tags attached</li>
            <li>Refund processing may take 3-5 business days</li>
            <li>Shipping costs are non-refundable unless the item was defective</li>
          </ul>
        </div>

        <div className="form-actions">
          <Button 
            variant="secondary"
            type="button"
            onClick={() => navigate(`/support/${caseId}`)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            type="submit"
            disabled={isSubmitting || !eligibility || !eligibility.all_eligible || selectedProducts.size === 0}
          >
            {isSubmitting ? 'Submitting...' : 'Submit Refund Request'}
          </Button>
        </div>
      </form>
    </div>
  )
}