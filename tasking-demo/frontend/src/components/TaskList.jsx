import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { api } from '../lib/api'
import './TaskList.css'

/**
 * TaskList - displays all tasks in a table view.
 * Shows key task information and allows navigation to task details.
 */
function TaskList({ onTaskSelected, onCreateNew }) {
  const [tasks, setTasks] = useState([])
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [statusFilter, setStatusFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [searchId, setSearchId] = useState('')
  const [sortField, setSortField] = useState('createdAt')
  const [sortOrder, setSortOrder] = useState('DESC')

  const loadContracts = async () => {
    try {
      const response = await api.getContracts()
      setContracts(response.data || [])
    } catch {
      // Silently fail - contract filter just won't be available
    }
  }

  const loadTasks = async (contractID = contractFilter, append = false, pageCursor = null) => {
    try {
      if (append) {
        setLoadingMore(true)
      } else {
        setLoading(true)
      }
      setError(null)
      
      const params = { limit: 50 }
      if (contractID) params.contractID = contractID
      if (pageCursor) params.cursor = pageCursor
      
      const response = await api.listTasks(params)
      setTasks(prev => append ? [...prev, ...(response.data || [])] : (response.data || []))
      setCursor(response.cursor || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  const loadMore = () => {
    if (cursor && !loadingMore) loadTasks(contractFilter, true, cursor)
  }

  useEffect(() => {
    loadContracts()
    loadTasks()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleContractFilterChange = (e) => {
    const newContractId = e.target.value
    setContractFilter(newContractId)
    loadTasks(newContractId)
  }

  const handleSort = (field) => {
    if (field === sortField) {
      setSortOrder(sortOrder === 'DESC' ? 'ASC' : 'DESC')
    } else {
      setSortField(field)
      setSortOrder('DESC')
    }
  }

  const getSortIndicator = (field) => {
    if (field !== sortField) return null
    return sortOrder === 'DESC' ? ' ↓' : ' ↑'
  }

  // Filter and sort tasks client-side
  const filteredTasks = tasks.filter(t => {
    if (statusFilter && t.status !== statusFilter) return false
    if (searchId && !t.id.toLowerCase().includes(searchId.toLowerCase().trim())) return false
    return true
  })

  const sortedTasks = [...filteredTasks].sort((a, b) => {
    let aVal = a[sortField]
    let bVal = b[sortField]
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) aVal = ''
    if (bVal === null || bVal === undefined) bVal = ''
    
    // String comparison
    if (typeof aVal === 'string') {
      aVal = aVal.toLowerCase()
      bVal = bVal.toLowerCase()
    }
    
    if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1
    if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1
    return 0
  })

  const getStatusClass = (status) => {
    const classes = {
      RECEIVED: 'status-received',
      ACTIVE: 'status-active',
      FULFILLED: 'status-fulfilled',
      DONE: 'status-done',
      CANCELED: 'status-canceled',
      FAILED: 'status-failed',
      REJECTED: 'status-rejected'
    }
    return classes[status] || 'status-default'
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatAcquisitionWindow = (window) => {
    if (!window?.start || !window?.end) return { start: '—', end: null }
    const opts = { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    const start = new Date(window.start).toLocaleString('en-US', opts)
    const end = new Date(window.end).toLocaleString('en-US', opts)
    return { start, end }
  }

  const formatSLA = (sla) => {
    if (!sla) return '—'
    return sla.replace('SLA_', '').replace('H', 'h')
  }

  const handleCopyId = (e, id) => {
    e.stopPropagation()
    navigator.clipboard.writeText(id)
  }

  return (
    <div className="task-list">
      <div className="task-list-header">
        <div>
          <h2>All Tasks</h2>
          <p>View and manage your tasking requests</p>
        </div>
        <button className="btn btn-primary" onClick={onCreateNew}>
          + Create New Task
        </button>
      </div>

      <div className="task-list-toolbar">
        <div className="filter-group">
          <label htmlFor="contract-filter">Contract</label>
          <select 
            id="contract-filter"
            value={contractFilter} 
            onChange={handleContractFilterChange}
          >
            <option value="">All Contracts</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Status</label>
          <select 
            id="status-filter"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All</option>
            <option value="RECEIVED">Received</option>
            <option value="ACTIVE">Active</option>
            <option value="FULFILLED">Fulfilled</option>
            <option value="DONE">Done</option>
            <option value="CANCELED">Canceled</option>
            <option value="FAILED">Failed</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
        <div className="filter-group search-group">
          <input
            type="text"
            id="task-search"
            placeholder="Search by Task ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
          />
          {searchId && (
            <button 
              className="btn btn-secondary btn-small" 
              onClick={() => setSearchId('')}
            >
              Clear
            </button>
          )}
        </div>
        <button className="btn btn-secondary btn-small" onClick={() => loadTasks()}>
          Refresh
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      {loading ? (
        <div className="loading">Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className="empty-state">
          <p>No tasks found.</p>
          <button className="btn btn-primary" onClick={onCreateNew}>
            Create Your First Task
          </button>
        </div>
      ) : (
        <div className="task-table-container">
          <table className="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('createdAt')}
                >
                  Created{getSortIndicator('createdAt')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('reference')}
                >
                  Reference{getSortIndicator('reference')}
                </th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('imagingMode')}
                >
                  Mode{getSortIndicator('imagingMode')}
                </th>
                <th className="col-narrow">Acq.<br/>Window</th>
                <th>Products</th>
                <th>SLA</th>
                <th 
                  className="sortable"
                  onClick={() => handleSort('status')}
                >
                  Status{getSortIndicator('status')}
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedTasks.map((task) => (
                <tr 
                  key={task.id} 
                  onClick={() => onTaskSelected(task)}
                  className="task-row"
                >
                  <td>
                    <span className="task-id-row">
                      <span className="task-id" title={task.id}>{task.id.slice(0, 8)}</span>
                      <button 
                        className="copy-btn"
                        title={`Copy: ${task.id}`}
                        onClick={(e) => handleCopyId(e, task.id)}
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                      </button>
                    </span>
                  </td>
                  <td>{formatDate(task.createdAt)}</td>
                  <td>{task.reference || '—'}</td>
                  <td>{task.imagingMode || '—'}</td>
                  <td>
                    {(() => {
                      const aw = formatAcquisitionWindow(task.acquisitionWindow)
                      return (
                        <div className="two-line-cell">
                          <span>{aw.start}</span>
                          <span>{aw.end}</span>
                        </div>
                      )
                    })()}
                  </td>
                  <td>
                    <div className="product-types">
                      {task.productTypes?.length > 0 
                        ? task.productTypes.map((type) => (
                            <span key={type} className="product-pill">{type}</span>
                          ))
                        : '—'
                      }
                    </div>
                  </td>
                  <td>{formatSLA(task.sla)}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(task.status)}`}>
                      {task.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="task-list-footer">
        <span className="task-count">
          {statusFilter || searchId
            ? `${sortedTasks.length} of ${tasks.length} tasks`
            : `${tasks.length} task${tasks.length !== 1 ? 's' : ''}`
          }
        </span>
        {cursor && (
          <button 
            className="btn btn-secondary btn-small" 
            onClick={loadMore}
            disabled={loadingMore}
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        )}
      </div>
    </div>
  )
}

TaskList.propTypes = {
  onTaskSelected: PropTypes.func.isRequired,
  onCreateNew: PropTypes.func.isRequired,
}

export default TaskList
