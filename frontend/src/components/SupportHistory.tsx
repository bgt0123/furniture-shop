import React, { useState } from 'react'
import { SupportCase } from '../../types/supportTypes'
import { Button } from '../Button'

interface SupportHistoryProps {
  cases: SupportCase[]
  onViewDetails: (caseId: string) => void
}

export const SupportHistory: React.FC<SupportHistoryProps> = ({ cases, onViewDetails }) => {
  const [filterStatus, setFilterStatus] = useState<'all' | 'Open' | 'Closed'>('all')
  const [searchTerm, setSearchTerm] = useState('')

  // Filter cases based on status and search term
  const filteredCases = cases.filter((supportCase) => {
    const matchesStatus = filterStatus === 'all' || supportCase.status === filterStatus
    const matchesSearch = searchTerm === '' || 
      supportCase.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      supportCase.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (supportCase.issueDescription && supportCase.issueDescription.toLowerCase().includes(searchTerm.toLowerCase()))
    return matchesStatus && matchesSearch
  })

  if (cases.length === 0) {
    return (
      <div className="support-history empty">
        <p>No support case history found.</p>
      </div>
    )
  }

  return (
    <div className="support-history">
      <h2>Support Case History</h2>

      <div className="history-controls">
        <div className="filter-group">
          <label htmlFor="status-filter">Status:</label>
          <select
            id="status-filter"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Open' | 'Closed')}
          >
            <option value="all">All Statuses</option>
            <option value="Open">Open</option>
            <option value="Closed">Closed</option>
          </select>
        </div>

        <div className="search-group">
          <input
            type="text"
            placeholder="Search cases..."
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
        <p>Showing {filteredCases.length} of {cases.length} support cases</p>
      </div>

      <div className="history-table-container">
        <table className="support-history-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Case ID</th>
              <th>Order ID</th>
              <th>Status</th>
              <th>Issue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCases.map((supportCase) => (
              <tr key={supportCase.id} className={`case-row ${supportCase.status.toLowerCase()}`}>
                <td>{new Date(supportCase.createdAt).toLocaleDateString()}</td>
                <td>{supportCase.id.substring(0, 8)}...</td>
                <td>{supportCase.orderId}</td>
                <td>
                  <span className={`status-badge ${supportCase.status.toLowerCase()}`}>
                    {supportCase.status}
                  </span>
                </td>
                <td>
                  {supportCase.issueDescription ? (
                    <>
                      {supportCase.issueDescription.substring(0, 50)}
                      {supportCase.issueDescription.length > 50 && '...'}
                    </>
                  ) : 'No description'}
                </td>
                <td>
                  <Button
                    variant="secondary"
                    onClick={() => onViewDetails(supportCase.id)}
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
          <p>No support cases match your criteria.</p>
        </div>
      )}
    </div>
  )
}