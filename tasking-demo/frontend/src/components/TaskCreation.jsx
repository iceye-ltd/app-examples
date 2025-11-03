import { useState, useEffect, useCallback } from 'react'
import PropTypes from 'prop-types'
import { api } from '../lib/api'
import MapPicker from './MapPicker'
import './TaskCreation.css'

function TaskCreation({ contract, onTaskCreated, onBack }) {
  // Default location: Helsinki, Finland (users can change via map or manual input)
  const [formData, setFormData] = useState({
    latitude: 60.1699,
    longitude: 24.9384,
    imaging_mode: contract.imagingModes?.allowed?.[0] || '',
    start_date: '',
    end_date: '',
    reference: '',
    // Advanced parameters - use contract defaults
    incidence_angle_min: 10,
    incidence_angle_max: 45,
    look_side: 'ANY',
    pass_direction: 'ANY',
    priority: contract.priority?.default || contract.priority?.allowed?.[0] || '',
    sla: contract.sla?.default || contract.sla?.allowed?.[0] || ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  // Wrap map location change handler in useCallback to prevent unnecessary re-renders
  const handleLocationChange = useCallback((lat, lon) => {
    setFormData(prev => ({...prev, latitude: lat, longitude: lon}))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const taskData = {
        contract_id: contract.id,
        location: {
          lat: parseFloat(formData.latitude),
          lon: parseFloat(formData.longitude)
        },
        imaging_mode: formData.imaging_mode,
        acquisition_window: {
          start: new Date(formData.start_date).toISOString(),
          end: new Date(formData.end_date).toISOString()
        },
        reference: formData.reference || undefined,
        // Advanced parameters (only include if not default/empty)
        incidence_angle: formData.incidence_angle_min && formData.incidence_angle_max ? {
          min: parseInt(formData.incidence_angle_min),
          max: parseInt(formData.incidence_angle_max)
        } : undefined,
        look_side: formData.look_side || undefined,
        pass_direction: formData.pass_direction || undefined,
        priority: formData.priority || undefined,
        sla: formData.sla || undefined
      }

      const task = await api.createTask(taskData)
      
      // Validate task response
      if (!task || !task.id) {
        throw new Error('Invalid task response from API')
      }
      
      onTaskCreated(task)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Set default acquisition window: tomorrow to day after (24-hour window)
  useEffect(() => {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    const dayAfter = new Date()
    dayAfter.setDate(dayAfter.getDate() + 2)
    
    setFormData(prev => ({
      ...prev,
      start_date: tomorrow.toISOString().slice(0, 16), // Format for datetime-local input
      end_date: dayAfter.toISOString().slice(0, 16)
    }))
  }, [])

  return (
    <div className={`task-creation ${isMapExpanded ? 'task-creation-map-expanded' : ''}`}>
      {!isMapExpanded && (
        <>
          <div className="task-header">
            <button className="btn btn-secondary" onClick={onBack}>
              ← Back to Contracts
            </button>
            <div>
              <h2>Create Tasking Request</h2>
            </div>
          </div>

          {error && (
            <div className="error">
              <strong>Error:</strong> {error}
            </div>
          )}
        </>
      )}

      <div className="task-content">
        {/* Map - always visible, expands to full screen */}
        <div className="map-section">
          <MapPicker
            latitude={parseFloat(formData.latitude)}
            longitude={parseFloat(formData.longitude)}
            onChange={handleLocationChange}
            isExpanded={isMapExpanded}
            onToggleExpand={() => setIsMapExpanded(!isMapExpanded)}
          />
        </div>

        {/* Floating form panel in expanded mode, normal form otherwise */}
        <form onSubmit={handleSubmit} className={`task-form ${isMapExpanded ? 'task-form-floating' : ''}`}>
          {isMapExpanded && (
            <div className="floating-form-header">
              <h3>Create Task</h3>
              <button 
                type="button" 
                className="btn-close-panel"
                onClick={() => setIsMapExpanded(false)}
              >
                ✕
              </button>
            </div>
          )}

          {!isMapExpanded && (
            <>
              {/* Manual coordinate inputs for precision - only in normal mode */}
              <div className="form-section">
                <h3>Location Coordinates</h3>
                <div className="coordinates-input">
                  <div className="form-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                        required
                      />
                      <span className="hint">-90 to 90</span>
                    </div>

                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        step="0.0001"
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                        required
                      />
                      <span className="hint">-180 to 180</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <div className="form-section">
            <h3>Imaging Parameters</h3>
            <div className="form-group">
              <label>Imaging Mode</label>
              <select
                value={formData.imaging_mode}
                onChange={(e) => setFormData({...formData, imaging_mode: e.target.value})}
                required
              >
                {contract.imagingModes?.allowed?.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-section">
            <h3>Acquisition Window</h3>
            <div className="form-row">
              <div className="form-group">
                <label>Start Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.start_date}
                  onChange={(e) => setFormData({...formData, start_date: e.target.value})}
                  required
                />
              </div>

              <div className="form-group">
                <label>End Date & Time</label>
                <input
                  type="datetime-local"
                  value={formData.end_date}
                  onChange={(e) => setFormData({...formData, end_date: e.target.value})}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-section">
            <h3>Reference (Optional)</h3>
            <div className="form-group">
              <label>Task Reference</label>
              <input
                type="text"
                value={formData.reference}
                onChange={(e) => setFormData({...formData, reference: e.target.value})}
                placeholder="e.g., Helsinki Port Monitoring"
                maxLength={256}
              />
              <span className="hint">Give your task a memorable name</span>
            </div>
          </div>

          <div className="form-section">
            <h3>Advanced Parameters</h3>
            <p className="section-description">
              Default values from your contract
            </p>
            
            <div className="form-row">
              <div className="form-group">
                <label>Incidence Angle Min (°)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={formData.incidence_angle_min}
                  onChange={(e) => setFormData({...formData, incidence_angle_min: e.target.value})}
                />
              </div>

              <div className="form-group">
                <label>Incidence Angle Max (°)</label>
                <input
                  type="number"
                  min="0"
                  max="90"
                  value={formData.incidence_angle_max}
                  onChange={(e) => setFormData({...formData, incidence_angle_max: e.target.value})}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Look Side</label>
                <select
                  value={formData.look_side}
                  onChange={(e) => setFormData({...formData, look_side: e.target.value})}
                >
                  <option value="ANY">ANY</option>
                  <option value="LEFT">LEFT</option>
                  <option value="RIGHT">RIGHT</option>
                </select>
              </div>

              <div className="form-group">
                <label>Pass Direction</label>
                <select
                  value={formData.pass_direction}
                  onChange={(e) => setFormData({...formData, pass_direction: e.target.value})}
                >
                  <option value="ANY">ANY</option>
                  <option value="ASCENDING">ASCENDING</option>
                  <option value="DESCENDING">DESCENDING</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({...formData, priority: e.target.value})}
                >
                  {contract.priority?.allowed?.length > 0 ? (
                    contract.priority.allowed.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))
                  ) : (
                    <option value="COMMERCIAL">COMMERCIAL</option>
                  )}
                </select>
              </div>

              <div className="form-group">
                <label>SLA</label>
                <select
                  value={formData.sla}
                  onChange={(e) => setFormData({...formData, sla: e.target.value})}
                >
                  {contract.sla?.allowed?.length > 0 ? (
                    contract.sla.allowed.map(s => (
                      <option key={s} value={s}>{s.replace('SLA_', '').replace('H', ' Hours')}</option>
                    ))
                  ) : (
                    <option value="SLA_24H">24 Hours</option>
                  )}
                </select>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              {loading ? 'Creating Task...' : 'Create Task'}
            </button>
          </div>
        </form>

        {/* Info sidebar - only in normal mode */}
        {!isMapExpanded && (
          <div className="task-info">
            <div className="info-card">
              <h4>Contract: {contract.name}</h4>
              <div className="default-item">
                <span>Contract ID:</span>
                <strong style={{ fontSize: '0.8rem', fontFamily: 'monospace' }}>
                  {contract.id}
                </strong>
              </div>
              <div className="default-item">
                <span>Priority:</span>
                <strong>{contract.priority?.default || 'N/A'}</strong>
              </div>
              <div className="default-item">
                <span>Exclusivity:</span>
                <strong>{contract.exclusivity?.default || 'N/A'}</strong>
              </div>
              <div className="default-item">
                <span>SLA:</span>
                <strong>{contract.sla?.default || 'N/A'}</strong>
              </div>
              <div className="default-item">
                <span>EULA:</span>
                <strong>{contract.eula?.default || 'N/A'}</strong>
              </div>
              {contract.imagingModes?.allowed && (
                <div className="default-item">
                  <span>Available Modes:</span>
                  <strong>{contract.imagingModes.allowed.length}</strong>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

TaskCreation.propTypes = {
  contract: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string,
    imagingModes: PropTypes.shape({
      allowed: PropTypes.arrayOf(PropTypes.string),
    }),
    priority: PropTypes.object,
    exclusivity: PropTypes.object,
    sla: PropTypes.object,
    eula: PropTypes.object,
  }).isRequired,
  onTaskCreated: PropTypes.func.isRequired,
  onBack: PropTypes.func.isRequired,
}

export default TaskCreation
