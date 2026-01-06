import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { RefundCaseList } from '../../components/RefundCaseList'
import { RefundCaseDetail } from '../../components/RefundCaseDetail'
import { refundApi } from '../../services/refundApi'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../../components/Button'

interface RefundDashboardProps {
  token: string
}

export const RefundDashboard: React.FC<RefundDashboardProps> = ({ token }) => {
  const [activeView, setActiveView] = useState<'list' | 'detail'>('list')
  const [selectedRefundId, setSelectedRefundId] = useState<string | null>(null)
  const [refundCases, setRefundCases] = useState<RefundCase[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterStatus, setFilterStatus] = useState<string | null>(null)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchRefundCases = async () => {
      try {
        setIsLoading(true)
        setError(null)
        
        refundApi.setAuthToken(token)
        const response = await refundApi.getRefundCases(filterStatus)
        setRefundCases(response.data.cases || [])
      } catch (err) {
        console.error('Error fetching refund cases:', err)
        setError('Failed to load refund cases. Please try again.')
      } finally {
        setIsLoading(false)
      }
    }
    
    if (token) {
      fetchRefundCases()
    }
  }, [token, filterStatus])

  const handleViewDetails = (refundId: string) => {
    setSelectedRefundId(refundId)
    setActiveView('detail')
  }

  const handleBackToList = () => {
    setActiveView('list')
    setSelectedRefundId(null)
  }

  const handleRequestRefund = (caseId: string) => {
    navigate(`/refunds/request/${caseId}`)
  }

  const renderContent = () => {
    switch (activeView) {
      case 'detail':
        return (
          <RefundCaseDetail 
            refundId={selectedRefundId || ''}
            token={token}
            onBack={handleBackToList}
          />
        )
      
      case 'list':
      default:
        return (
          <RefundCaseList 
            cases={refundCases} 
            onViewDetails={handleViewDetails}
            token={token}
            onRequestRefund={handleRequestRefund}
          />
        )
    }
  }

  return (
    <Layout>
      <div className="refund-dashboard">
        <div className="dashboard-header">
          <h1>Refund Dashboard</h1>
          
          <div className="filter-controls">
            <select
              value={filterStatus || ''}
              onChange={(e) => setFilterStatus(e.target.value || null)}
              className="status-filter"
            >
              <option value="">All Statuses</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Completed">Completed</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="error-banner">
            <p>{error}</p>
            <Button variant="secondary" onClick={() => setError(null)}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="dashboard-content">
          {isLoading && activeView === 'list' ? (
            <div className="loading">Loading refund cases...</div>
          ) : (
            renderContent()
          )}
        </div>

        {activeView === 'list' && (
          <div className="dashboard-info">
            <h3>Refund Information</h3>
            <p>Here you can view and manage all your refund requests. Refunds are typically processed within 3-5 business days.</p>
            <p>To request a refund, go to your support cases and select the products you want to return.</p>
          </div>
        )}
      </div>
    </Layout>
  )
}