import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Layout } from '../../components/Layout'
import { SupportCaseForm } from '../../components/SupportCaseForm'
import { SupportCaseList } from '../../components/SupportCaseList'
import { SupportCaseDetail } from '../../components/SupportCaseDetail'
import { CaseHistory } from '../../components/CaseHistory'
import { SupportHistory } from '../../components/SupportHistory'
import { supportApi } from '../../services/supportApi'
import { SupportCase } from '../../types/supportTypes'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../../components/Button'

interface SupportDashboardProps {
  token: string
}

interface SupportDashboardState {
  activeView: 'list' | 'create' | 'detail' | 'history' | 'support-history'
  selectedCaseId: string | null
  cases: SupportCase[]
  refundCases: RefundCase[]
  isLoading: boolean
  error: string | null
}

export const SupportDashboard: React.FC<SupportDashboardProps> = ({ token }) => {
  const [state, setState] = useState<SupportDashboardState>({
    activeView: 'list',
    selectedCaseId: null,
    cases: [],
    refundCases: [],
    isLoading: true,
    error: null
  })
  const navigate = useNavigate()

  useEffect(() => {
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }))

        // Fetch support cases
        supportApi.setAuthToken(token)
        const supportResponse = await supportApi.getSupportCases()
        const supportCases = supportResponse.data.cases || []

        // Fetch refund cases for history view
        const refundResponse = await supportApi.getRefundCases()
        const refundCases = refundResponse.data.refunds || []

        setState(prev => ({
          ...prev,
          cases: supportCases,
          refundCases: refundCases,
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
  }, [token])

  const handleCaseCreated = (newCase: SupportCase) => {
    setState(prev => ({
      ...prev,
      cases: [...prev.cases, newCase]
    }))
    setState(prev => ({ ...prev, activeView: 'list' }))
  }

  const handleViewDetails = (caseId: string) => {
    setState(prev => ({ ...prev, selectedCaseId: caseId, activeView: 'detail' }))
  }

  const handleBackToList = () => {
    setState(prev => ({ ...prev, activeView: 'list', selectedCaseId: null }))
  }

  const handleViewHistory = () => {
    setState(prev => ({ ...prev, activeView: 'history' }))
  }

  const handleViewSupportHistory = () => {
    setState(prev => ({ ...prev, activeView: 'support-history' }))
  }

  const handleViewRefundCase = (refundId: string) => {
    // Navigate to refund dashboard or show refund details
    navigate(`/refunds/${refundId}`)
  }

  const renderContent = () => {
    switch (state.activeView) {
      case 'create':
        return (
          <SupportCaseForm 
            onCaseCreated={handleCaseCreated} 
            token={token}
          />
        )
      
      case 'detail':
        return (
          <SupportCaseDetail 
            token={token}
          />
        )
      
      case 'history':
        return (
          <CaseHistory
            supportCases={state.cases}
            refundCases={state.refundCases}
            onViewSupportCase={handleViewDetails}
            onViewRefundCase={handleViewRefundCase}
          />
        )
      
      case 'support-history':
        return (
          <SupportHistory
            cases={state.cases}
            onViewDetails={handleViewDetails}
          />
        )
      
      case 'list':
      default:
        return (
          <SupportCaseList 
            cases={state.cases} 
            onViewDetails={handleViewDetails} 
            token={token}
          />
        )
    }
  }

  return (
    <Layout>
      <div className="support-dashboard">
        <div className="dashboard-header">
          <h1>Support Dashboard</h1>
          
        <div className="dashboard-actions">
          {state.activeView === 'list' && (
            <Button 
              variant="primary" 
              onClick={() => setState(prev => ({ ...prev, activeView: 'create' }))}
            >
              Create Support Case
            </Button>
          )}
           
          <div className="view-toggle">
            <Button
              variant={state.activeView === 'list' ? 'primary' : 'secondary'}
              onClick={() => setState(prev => ({ ...prev, activeView: 'list' }))}
              size="small"
            >
              Current Cases
            </Button>
            
            <Button
              variant={state.activeView === 'history' ? 'primary' : 'secondary'}
              onClick={handleViewHistory}
              size="small"
            >
              All History
            </Button>
            
            <Button
              variant={state.activeView === 'support-history' ? 'primary' : 'secondary'}
              onClick={handleViewSupportHistory}
              size="small"
            >
              Support History
            </Button>
          </div>
          
          {state.activeView !== 'list' && (
            <Button 
              variant="secondary" 
              onClick={handleBackToList}
            >
              Back to List
            </Button>
          )}
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
            <div className="loading">Loading support cases...</div>
          ) : (
            renderContent()
          )}
        </div>
      </div>
    </Layout>
  )
}