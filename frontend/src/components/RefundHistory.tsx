import React, { useState } from 'react'
import { RefundCase } from '../../types/refundTypes'
import { Button } from '../Button'

interface RefundHistoryProps {
  cases: RefundCase[]
  onViewDetails: (refundId: string) => void
}

export const RefundHistory: React.FC<RefundHistoryProps> = ({ cases, onViewDetails }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Pending' | 'Approved' | 'Rejected' | 'Completed'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date')

  // Filter and sort cases
  const filteredCases = cases
    .filter((refundCase) => {
      const matchesStatus = filterStatus === 'all' || refundCase.status === filterStatus
      const matchesSearch = searchTerm === '' || 
        refundCase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refundCase.supportCaseId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        refundCase.orderId.toLowerCase().includes(searchTerm.toLowerCase())
      return matchesStatus && matchesSearch
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      } else {
        return b.totalRefundAmount - a.totalRefundAmount
      }
    })

  if (cases.length === 0) {
    return (
      <div className="refund-history empty">
        <p>No refund case history found.</p>
      </div>
    )
  }

  return (
    <div className="refund-history">
      <h2>Refund Case History</h2>

      <div className="history-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Pending' | 'Approved' | 'Rejected' | 'Completed')}
          >
            <option value="all">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="sort-by">Sort By:</label>
          <select
            id="sort-by"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'amount')}
          >
            <option value="date">Date (Newest First)</option>
            <option value="amount">Amount (Highest First)</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search refunds..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {searchTerm && (
          <Button variant="secondary" onClick={() => setSearchTerm('')}>
            Clear Search
          </Button>
        )}
      </div>

      <div className="history-stats">
        <p>Showing {filteredCases.length} of {cases.length} refund cases</p>
        <p>Total Refund Amount: ${cases.reduce((sum, case) => sum + case.totalRefundAmount, 0).toFixed(2)}</p>
      </div>

      <div className="history-table-container">
        <table className="refund-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Refund ID</th>
              <th>Support Case</th>
              <th>Order ID</th>
              <th>Status</th>
              <th>Amount</th>
              <th>Eligibility</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((refundCase) => (
              <tr key={refundCase.id} className={`case-row ${refundCase.status.toLowerCase()}`}>
                <td>{new Date(refundCase.createdAt).toLocaleDateString()}</td>
                <td>{refundCase.id.substring(0, 8)}...</td>
                <td>{refundCase.supportCaseId.substring(0, 8)}...</td>
                <td>{refundCase.orderId}</td>
                <td>
                  <span className={`status-badge ${refundCase.status.toLowerCase()}`}>
                    {refundCase.status}
                  </span>
                </td>
                <td>${refundCase.totalRefundAmount.toFixed(2)}</td>
                <td>
                  <span className={`eligibility-badge ${refundCase.eligibilityStatus.toLowerCase().replace(' ', '-')}`}>
                    {refundCase.eligibilityStatus}
                  </span>
                </td>
                <td>
                  <Button
                    variant="secondary"
                    onClick={() => onViewDetails(refundCase.id)}
                    size="small"
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredCases.length === 0 && (
        <div className="no-results">
          <p>No refund cases match your criteria.</p>
        </div>
      )}
    </div>
  )
}