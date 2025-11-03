import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { api } from '../lib/api'
import './ContractSelection.css'

function ContractSelection({ onContractSelected }) {
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Load contracts on component mount
  useEffect(() => {
    loadContracts()
  }, [])

  const loadContracts = async () => {
    try {
      setLoading(true)
      const data = await api.getContracts()
      setContracts(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading contracts...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="card">
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
        <button className="btn btn-secondary" onClick={loadContracts}>
          Try Again
        </button>
      </div>
    )
  }

  if (contracts.length === 0) {
    return (
      <div className="card">
        <h2>No Contracts Found</h2>
        <p>No contracts are available. Please contact ICEYE support.</p>
      </div>
    )
  }

  // Filter contracts based on search query
  const filteredContracts = contracts.filter((contract) => {
    const query = searchQuery.toLowerCase()
    return (
      contract.name?.toLowerCase().includes(query) ||
      contract.id?.toLowerCase().includes(query) ||
      contract.priority?.default?.toLowerCase().includes(query) ||
      contract.sla?.default?.toLowerCase().includes(query)
    )
  })

  return (
    <div className="contract-selection">
      <h2>Select a Contract</h2>
      <p className="subtitle">Choose which contract to use for tasking</p>

      {/* Search bar */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search contracts by name, ID, priority, or SLA..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
        />
        {searchQuery && (
          <button 
            className="clear-search"
            onClick={() => setSearchQuery('')}
            aria-label="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Show count */}
      {searchQuery && (
        <p className="search-results">
          Found {filteredContracts.length} of {contracts.length} contracts
        </p>
      )}

      {filteredContracts.length === 0 && searchQuery ? (
        <div className="no-results">
          <p>No contracts match "{searchQuery}"</p>
          <button className="btn btn-secondary" onClick={() => setSearchQuery('')}>
            Clear Search
          </button>
        </div>
      ) : (
        <div className="contracts-grid">
          {filteredContracts.map((contract) => (
          <div 
            key={contract.id} 
            className="contract-card"
            onClick={() => onContractSelected(contract)}
          >
            <div className="contract-header">
              <h3>{contract.name}</h3>
              <span className="contract-id">{contract.id.slice(0, 8)}...</span> {/* Show first 8 chars of UUID */}
            </div>

            <div className="contract-details">
              <div className="detail-row">
                <span className="label">Priority:</span>
                <span className="value">{contract.priority?.default || 'N/A'}</span>
              </div>

              <div className="detail-row">
                <span className="label">SLA:</span>
                <span className="value">{contract.sla?.default || 'N/A'}</span>
              </div>

              <div className="detail-row">
                <span className="label">Valid Until:</span>
                <span className="value">
                  {contract.end ? new Date(contract.end).toLocaleDateString() : 'N/A'}
                </span>
              </div>
            </div>

            <div className="contract-modes-section">
              <div className="modes-header">
                <span className="label">Imaging Modes</span>
                <span className="modes-count">{contract.imagingModes?.allowed?.length || 0} available</span>
              </div>
              <div className="contract-modes">
                {contract.imagingModes?.allowed?.map((mode, index) => (
                  <span key={`${contract.id}-${mode}-${index}`} className="mode-badge">{mode}</span>
                ))}
              </div>
            </div>

            <button className="btn btn-primary contract-select-btn">
              Select Contract →
            </button>
          </div>
        ))}
        </div>
      )}
    </div>
  )
}

ContractSelection.propTypes = {
  onContractSelected: PropTypes.func.isRequired,
}

export default ContractSelection
