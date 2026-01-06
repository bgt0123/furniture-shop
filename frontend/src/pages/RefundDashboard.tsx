import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { RefundCaseList } from '../../components/RefundCaseList'
import { RefundCaseDetail } from '../../components/RefundCaseDetail'
import { RefundHistory } from '../../components/RefundHistory'
import { CaseHistory } from '../../components/CaseHistory'
import { refundApi } from '../../services/refundApi'
import { RefundCase } from '../../types/refundTypes'
import { SupportCase } from '../../types/supportTypes'
import { Button } from '../../components/Button'

interface RefundDashboardProps {
  token: string
}

interface RefundDashboardState {
  activeView: 'list' | 'detail' | 'history' | 'refund-history'
  selectedRefundId: string | null
  refundCases: RefundCase[]
  supportCases: SupportCase[]
  isLoading: boolean
  error: string | null
  filterStatus: string | null
}

export const RefundDashboard: React.FC<RefundDashboardProps> = ({ token }) => {
  const [state, setState] = useState<RefundDashboardState>({
    activeView: 'list',
    selectedRefundId: null,
    refundCases: [],
    supportCases: [],
    isLoading: true,
    error: null,
    filterStatus: null
  })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch refund cases
        refundApi.setAuthToken(token)
        const refundResponse = await refundApi.getRefundCases(state.filterStatus)
        const refundCases = refundResponse.data.cases || []

        // Fetch support cases for history view
        const supportResponse = await refundApi.getSupportCases()
        const supportCases = supportResponse.data.cases || []

        setState(prev => ({
          ...prev,
          refundCases: refundCases,
          supportCases: supportCases,
          isLoading: false
        }))
      } catch (err) {
        console.error('Error fetching data:', err)
        setState(prev => ({ ...prev, error: 'Failed to load data. Please try again.', isLoading: false }))
      }
    }

    if (token) {
      fetchData()
    }
  }, [token, state.filterStatus])

  const handleViewDetails = (refundId: string) => {
    setState(prev => ({ ...prev, selectedRefundId: refundId, activeView: 'detail' }))
  }

  const handleBackToList = () => {
    setState(prev => ({ ...prev, activeView: 'list', selectedRefundId: null }))
  }

  const handleRequestRefund = (caseId: string) => {
    navigate(`/refunds/request/${caseId}`)
  }

  const handleViewHistory = () => {
    setState(prev => ({ ...prev, activeView: 'history' }))
  }

  const handleViewRefundHistory = () => {
    setState(prev => ({ ...prev, activeView: 'refund-history' }))
  }

  const handleViewSupportCase = (caseId: string) => {
    navigate(`/support/${caseId}`)
  }

  const renderContent = () => {
    switch (state.activeView) {
      case 'detail':
        return (
          <RefundCaseDetail 
            refundId={state.selectedRefundId || ''}
            token={token}
            onBack={handleBackToList}
          />
        )
      
      case 'history':
        return (
          <CaseHistory
            supportCases={state.supportCases}
            refundCases={state.refundCases}
            onViewSupportCase={handleViewSupportCase}
            onViewRefundCase={handleViewDetails}
          />
        )
      
      case 'refund-history':
        return (
          <RefundHistory
            cases={state.refundCases}
            onViewDetails={handleViewDetails}
          />
        )
      
      case 'list':
      default:
        return (
          <RefundCaseList 
            cases={state.refundCases} 
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
          
          <div className="view-toggle">
            <Button
              variant={state.activeView === 'list' ? 'primary' : 'secondary'}
              onClick={() => setState(prev => ({ ...prev, activeView: 'list' }))}
              size="small"
            >
              Current Refunds
            </Button>
            
            <Button
              variant={state.activeView === 'history' ? 'primary' : 'secondary'}
              onClick={handleViewHistory}
              size="small"
            >
              All History
            </Button>
            
            <Button
              variant={state.activeView === 'refund-history' ? 'primary' : 'secondary'}
              onClick={handleViewRefundHistory}
              size="small"
            >
              Refund History
            </Button>
          </div>
          
          <div className="filter-controls">
            <select
              value={state.filterStatus || ''}
              onChange={(e) => setState(prev => ({ ...prev, filterStatus: e.target.value || null }))}
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

        {state.error && (
          <div className="error-banner">
            <p>{state.error}</p>
            <Button variant="secondary" onClick={() => setState(prev => ({ ...prev, error: null }))}>
              Dismiss
            </Button>
          </div>
        )}

        <div className="dashboard-content">
          {state.isLoading && state.activeView === 'list' ? (
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