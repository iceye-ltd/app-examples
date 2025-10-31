import PropTypes from 'prop-types'
import './TaskTimeline.css'

/**
 * Visual timeline showing task progression through 4 stages:
 * RECEIVED → ACTIVE → FULFILLED → DONE
 */
function TaskTimeline({ currentStatus }) {
  // Define the 4 main stages of ICEYE task lifecycle
  const stages = [
    {
      status: 'RECEIVED',
      label: 'Received',
      description: 'Task queued',
      icon: '1'
    },
    {
      status: 'ACTIVE',
      label: 'Active',
      description: 'Satellite scheduled',
      icon: '2'
    },
    {
      status: 'FULFILLED',
      label: 'Fulfilled',
      description: 'SLA products ready',
      icon: '3'
    },
    {
      status: 'DONE',
      label: 'Done',
      description: 'All products ready',
      icon: '4'
    }
  ]

  // Map status strings to timeline position
  const statusToIndex = {
    'RECEIVED': 0,
    'ACTIVE': 1,
    'FULFILLED': 2,
    'DONE': 3
  }

  const currentStageIndex = statusToIndex[currentStatus] ?? 0
  
  // Handle terminal error states (task won't proceed)
  const isTerminalError = ['CANCELED', 'FAILED', 'REJECTED'].includes(currentStatus)

  // Show error UI for terminal states
  if (isTerminalError) {
    return (
      <div className="task-timeline-error">
        <div className="timeline-error-content">
          <span className="timeline-error-icon">
            {currentStatus === 'CANCELED' ? '!' : 'X'}
          </span>
          <div className="timeline-error-text">
            <strong>
              {currentStatus === 'CANCELED' && 'Task Canceled'}
              {currentStatus === 'REJECTED' && 'Task Rejected by ICEYE'}
              {currentStatus === 'FAILED' && 'Task Failed'}
            </strong>
            <p>This task will not be processed.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="task-timeline">
      <div className="timeline-header">
        <h3>Task Progress</h3>
      </div>
      
      <div className="timeline-stages">
        {stages.map((stage, index) => {
          // Current stage and all before it are completed
          const isCompleted = index <= currentStageIndex
          // Next stage after current is "in progress"
          const isInProgress = index === currentStageIndex + 1
          // Rest are pending
          const isPending = index > currentStageIndex + 1

          return (
            <div key={stage.status} className="timeline-stage-wrapper">
              <div className={`timeline-stage ${
                isCompleted ? 'completed' : 
                isInProgress ? 'in-progress' : 
                'pending'
              }`}>
                <div className="stage-icon">
                  {isCompleted ? '✓' : stage.icon}
                </div>
                <div className="stage-content">
                  <div className="stage-label">{stage.label}</div>
                  <div className="stage-description">{stage.description}</div>
                </div>
              </div>

              {index < stages.length - 1 && (
                <div className={`timeline-connector ${
                  index < currentStageIndex ? 'completed' : 'pending'
                }`}></div>
              )}
            </div>
          )
        })}
      </div>

      <div className="timeline-current-status">
        <span className="status-dot"></span>
        <span className="status-text">
          {currentStageIndex === 0 && 'Scheduling satellite...'}
          {currentStageIndex === 1 && 'Capturing image...'}
          {currentStageIndex === 2 && 'Processing products...'}
          {currentStageIndex === 3 && 'Complete!'}
        </span>
      </div>
    </div>
  )
}

TaskTimeline.propTypes = {
  currentStatus: PropTypes.string.isRequired,
}

export default TaskTimeline
