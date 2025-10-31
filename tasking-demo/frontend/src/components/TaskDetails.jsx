import PropTypes from 'prop-types'
import './TaskMonitoring.css'

/**
 * Displays task configuration, scene details, and terminal state information.
 * Shows different views based on task status (active, completed, failed, etc.)
 */
function TaskDetails({ task, scene }) {
  const isTerminalError = ['CANCELED', 'REJECTED', 'FAILED'].includes(task.status)
  const showScene = ['ACTIVE', 'FULFILLED', 'DONE'].includes(task.status) && scene

  return (
    <>
      {/* Scene Details - Shows planned parameters (ACTIVE) or actual capture data (FULFILLED/DONE) */}
      {showScene && (
        <div className="scene-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Scene Details</h3>
            <span style={{ 
              fontSize: '0.875rem', 
              fontWeight: '500',
              color: task.status === 'ACTIVE' ? '#f59e0b' : '#10b981',
              background: task.status === 'ACTIVE' ? '#fef3c7' : '#d1fae5',
              padding: '0.25rem 0.75rem',
              borderRadius: '6px'
            }}>
              {task.status === 'ACTIVE' ? 'Planned' : 'Actual'}
            </span>
          </div>
          <div className="scene-time">
            <div className="scene-time-label">Imaging Time</div>
            <div className="scene-time-value">
              <div><strong>Start:</strong> {new Date(scene.imagingTime.start).toLocaleString('en-US', { timeZoneName: 'short' })}</div>
              <div><strong>End:</strong> {new Date(scene.imagingTime.end).toLocaleString('en-US', { timeZoneName: 'short' })}</div>
            </div>
          </div>
          <div className="scene-meta">
            <div className="scene-meta-item">
              <span>Duration</span>
              <strong>{scene.duration}s</strong>
            </div>
            {scene.incidenceAngle && (
              <div className="scene-meta-item">
                <span>Incidence Angle</span>
                <strong>{parseFloat(scene.incidenceAngle).toFixed(2)}°</strong>
              </div>
            )}
            {scene.lookSide && (
              <div className="scene-meta-item">
                <span>Look Side</span>
                <strong>{scene.lookSide}</strong>
              </div>
            )}
            {scene.passDirection && (
              <div className="scene-meta-item">
                <span>Pass Direction</span>
                <strong>{scene.passDirection}</strong>
              </div>
            )}
            {scene.azimuth && (
              <div className="scene-meta-item">
                <span>Azimuth</span>
                <strong>{scene.azimuth.toFixed(1)}°</strong>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Task Configuration Info */}
      <div className="task-info-card">
        <h3>Task Configuration</h3>
        <div className="task-info-grid">
          {/* Core Task Info */}
          <div className="task-info-item">
            <span>Task ID</span>
            <strong style={{ fontSize: '0.8125rem', fontFamily: 'monospace' }}>{task.id}</strong>
          </div>
          <div className="task-info-item">
            <span>Status</span>
            <strong>{task.status}</strong>
          </div>
          {task.reference && (
            <div className="task-info-item">
              <span>Reference</span>
              <strong>{task.reference}</strong>
            </div>
          )}
          
          {/* Imaging Parameters */}
          <div className="task-info-item">
            <span>Imaging Mode</span>
            <strong>{task.imagingMode}</strong>
          </div>
          <div className="task-info-item">
            <span>Target Location</span>
            <strong>
              {task.pointOfInterest?.lat.toFixed(4)}°, {task.pointOfInterest?.lon.toFixed(4)}°
            </strong>
          </div>
          {task.incidenceAngle && (
            <div className="task-info-item">
              <span>Requested Angle Range</span>
              <strong>{task.incidenceAngle.min}° - {task.incidenceAngle.max}°</strong>
            </div>
          )}
          {task.imagingDuration && (
            <div className="task-info-item">
              <span>Requested Duration</span>
              <strong>{task.imagingDuration}s</strong>
            </div>
          )}
          
          {/* Time Windows */}
          <div className="task-info-item">
            <span>Acquisition Window</span>
            <strong>
              <div>{new Date(task.acquisitionWindow?.start).toLocaleString('en-US', { timeZoneName: 'short' })}</div>
              <div>to {new Date(task.acquisitionWindow?.end).toLocaleString('en-US', { timeZoneName: 'short' })}</div>
            </strong>
          </div>
          
          {/* Business Parameters */}
          {task.priority && (
            <div className="task-info-item">
              <span>Priority</span>
              <strong>{task.priority}</strong>
            </div>
          )}
          {task.exclusivity && (
            <div className="task-info-item">
              <span>Exclusivity</span>
              <strong>{task.exclusivity}</strong>
            </div>
          )}
          {task.sla && (
            <div className="task-info-item">
              <span>SLA</span>
              <strong>{task.sla.replace('SLA_', '').replace('H', ' hours')}</strong>
            </div>
          )}
          {task.productsAvailableInSeconds && (
            <div className="task-info-item">
              <span>Products Ready After Capture</span>
              <strong>{Math.round(task.productsAvailableInSeconds / 3600)} hours</strong>
            </div>
          )}
          
          {/* Timestamps */}
          <div className="task-info-item">
            <span>Created At</span>
            <strong>{new Date(task.createdAt).toLocaleString('en-US', { timeZoneName: 'short' })}</strong>
          </div>
          <div className="task-info-item">
            <span>Updated At</span>
            <strong>{new Date(task.updatedAt).toLocaleString('en-US', { timeZoneName: 'short' })}</strong>
          </div>
          {task.fulfilledAt && (
            <div className="task-info-item">
              <span>Fulfilled At</span>
              <strong>{new Date(task.fulfilledAt).toLocaleString('en-US', { timeZoneName: 'short' })}</strong>
            </div>
          )}
        </div>
      </div>

      {/* Terminal States Info */}
      {isTerminalError && (
        <div className={`terminal-state-card ${task.status.toLowerCase()}`}>
          <h3>
            {task.status === 'CANCELED' && 'Task Canceled'}
            {task.status === 'REJECTED' && 'Task Rejected by ICEYE'}
            {task.status === 'FAILED' && 'Task Failed'}
          </h3>
          <div className="terminal-state-info">
            <p>
              {task.status === 'CANCELED' && 'This task was canceled and will not be processed.'}
              {task.status === 'REJECTED' && 'ICEYE rejected this task and it will not be processed.'}
              {task.status === 'FAILED' && 'This task failed and will not be processed.'}
            </p>
            
            <div className="terminal-state-details">
              <div className="detail-item">
                <span>Status:</span>
                <strong>{task.status}</strong>
              </div>
              <div className="detail-item">
                <span>Last Updated:</span>
                <strong>{new Date(task.updatedAt).toLocaleString('en-US', { timeZoneName: 'short' })}</strong>
              </div>
              <div className="detail-item">
                <span>Task ID:</span>
                <strong style={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>{task.id}</strong>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

TaskDetails.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    pointOfInterest: PropTypes.object,
    imagingMode: PropTypes.string,
    reference: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    fulfilledAt: PropTypes.string,
    acquisitionWindow: PropTypes.object,
    incidenceAngle: PropTypes.object,
    imagingDuration: PropTypes.number,
    priority: PropTypes.string,
    exclusivity: PropTypes.string,
    sla: PropTypes.string,
    productsAvailableInSeconds: PropTypes.number,
  }).isRequired,
  scene: PropTypes.shape({
    imagingTime: PropTypes.shape({
      start: PropTypes.string.isRequired,
      end: PropTypes.string.isRequired,
    }).isRequired,
    duration: PropTypes.number.isRequired,
    incidenceAngle: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),  // API spec: string (but handle both)
    lookSide: PropTypes.string,
    passDirection: PropTypes.string,
    azimuth: PropTypes.number,
  }),
}

export default TaskDetails
