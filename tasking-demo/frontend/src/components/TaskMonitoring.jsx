import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { api } from '../lib/api'
import TaskTimeline from './TaskTimeline'
import TaskDetails from './TaskDetails'
import TaskProducts from './TaskProducts'
import './TaskMonitoring.css'

/**
 * Main task monitoring component.
 * Handles polling for task status updates and coordinates child components.
 * Auto-refreshes every 5 seconds until task reaches a terminal state.
 */
function TaskMonitoring({ task: initialTask, onReset }) {
  const [task, setTask] = useState(initialTask)
  const [scene, setScene] = useState(null)
  const [loading, setLoading] = useState(false)
  const [cancelLoading, setCancelLoading] = useState(false)
  const [error, setError] = useState(null)
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(5)
  
  // Track when to load scene data (avoid duplicate requests)
  const lastSceneStatusRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const countdownIntervalRef = useRef(null)

  // Validate task has required fields
  if (!task || !task.id) {
    return (
      <div className="task-monitoring">
        <div className="error">
          <strong>Error:</strong> Invalid task data. Please create a new task.
        </div>
        <button className="btn btn-primary" onClick={onReset}>
          Create New Task
        </button>
      </div>
    )
  }

  // Set up polling on mount
  useEffect(() => {
    // Initial refresh
    refreshTask()

    // Poll for task status every 5 seconds
    pollingIntervalRef.current = setInterval(() => {
      refreshTask()
      setSecondsUntilRefresh(5)
    }, 5000)

    // Update countdown every second
    countdownIntervalRef.current = setInterval(() => {
      setSecondsUntilRefresh(prev => Math.max(0, prev - 1))
    }, 1000)

    // Cleanup: Stop timers when user navigates away from this screen
    return () => {
      if (pollingIntervalRef.current) clearInterval(pollingIntervalRef.current)
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current)
    }
  }, [])

  const refreshTask = async () => {
    try {
      setSecondsUntilRefresh(5)
      
      const updatedTask = await api.getTask(task.id)
      setTask(updatedTask)
      
      // Load scene data when status changes
      // Scene data evolves: ACTIVE = planned parameters, FULFILLED/DONE = actual capture data
      const shouldLoadScene = 
        (updatedTask.status === 'ACTIVE' && lastSceneStatusRef.current !== 'ACTIVE') ||
        (updatedTask.status === 'FULFILLED' && lastSceneStatusRef.current !== 'FULFILLED') ||
        (updatedTask.status === 'DONE' && lastSceneStatusRef.current !== 'DONE')
      
      if (shouldLoadScene) {
        lastSceneStatusRef.current = updatedTask.status
        loadScene()
      }
      
      // Stop polling when task reaches a terminal state (no more updates expected)
      const isTerminalState = ['DONE', 'FAILED', 'REJECTED', 'CANCELED'].includes(updatedTask.status)
      if (isTerminalState) {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current)
          pollingIntervalRef.current = null
        }
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current)
          countdownIntervalRef.current = null
        }
      }
    } catch (err) {
      setError(err.message)
    }
  }

  const loadScene = async () => {
    try {
      const sceneData = await api.getTaskScene(task.id)
      setScene(sceneData)
    } catch (err) {
      // Scene might not be available yet, silently fail
    }
  }

  const handleCancelTask = async () => {
    if (!window.confirm('Are you sure you want to cancel this task? This action cannot be undone.')) {
      return
    }

    try {
      setCancelLoading(true)
      setError(null)
      await api.cancelTask(task.id)
      // Refresh task to show new status
      const updatedTask = await api.getTask(task.id)
      setTask(updatedTask)
    } catch (err) {
      setError(err.message)
    } finally {
      setCancelLoading(false)
    }
  }

  const canCancel = ['RECEIVED', 'ACTIVE'].includes(task.status)
  const isPolling = !['DONE', 'FAILED', 'REJECTED', 'CANCELED'].includes(task.status)
  const isTerminalError = ['CANCELED', 'REJECTED', 'FAILED'].includes(task.status)

  return (
    <div className="task-monitoring">
      {/* Header */}
      <div className="monitoring-header">
        <div>
          <h2>Task Monitoring</h2>
          <p className="task-id">Task ID: {task.id}</p>
        </div>
        <button className="btn btn-secondary" onClick={onReset}>
          Create New Task
        </button>
      </div>

      {error && (
        <div className="error">
          <strong>Error:</strong> {error}
        </div>
      )}

      <div className="monitoring-content">
        {/* Timeline showing task progression */}
        <TaskTimeline currentStatus={task.status} />

        {/* Actions Bar - Only show for non-terminal states */}
        {isPolling && (
          <div className="actions-bar">
            <div className="polling-info">
              <button className="btn-refresh-simple" onClick={refreshTask}>
                Refresh Now
              </button>
              <div className="polling-status">
                <span className="polling-indicator"></span>
                <span>Auto-refresh in</span>
                <span className="next-refresh">
                  {secondsUntilRefresh}s
                </span>
              </div>
            </div>
            {canCancel && (
              <button 
                className="btn-cancel-simple" 
                onClick={handleCancelTask}
                disabled={cancelLoading}
              >
                {cancelLoading ? 'Canceling...' : 'Cancel Task'}
              </button>
            )}
          </div>
        )}

        {/* Task details (scene, configuration, terminal states) */}
        <TaskDetails task={task} scene={scene} />

        {/* Products section (only shows when FULFILLED or DONE) */}
        <TaskProducts taskId={task.id} taskStatus={task.status} />

        {/* Terminal state action button */}
        {isTerminalError && (
          <div className="terminal-state-card">
            <div className="terminal-state-actions">
              <button className="btn btn-primary" onClick={onReset}>
                Create New Task
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

TaskMonitoring.propTypes = {
  task: PropTypes.shape({
    id: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
    pointOfInterest: PropTypes.object,
    imagingMode: PropTypes.string,
    reference: PropTypes.string,
    createdAt: PropTypes.string.isRequired,
    updatedAt: PropTypes.string.isRequired,
    contractID: PropTypes.string,
  }).isRequired,
  onReset: PropTypes.func.isRequired,
}

export default TaskMonitoring
