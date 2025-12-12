import { useState } from 'react'
import ContractSelection from './components/ContractSelection'
import TaskCreation from './components/TaskCreation'
import TaskMonitoring from './components/TaskMonitoring'
import TaskList from './components/TaskList'
import './App.css'

function App() {
  // Views: 'contracts' | 'create' | 'monitor' | 'list'
  const [view, setView] = useState('contracts')
  const [selectedContract, setSelectedContract] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)

  const handleContractSelected = (contract) => {
    setSelectedContract(contract)
    setView('create')
  }

  const handleTaskCreated = (task) => {
    setSelectedTask(task)
    setView('monitor')
  }

  const handleTaskSelected = (task) => {
    setSelectedTask(task)
    setView('monitor')
  }

  const handleReset = () => {
    setView('contracts')
    setSelectedContract(null)
    setSelectedTask(null)
  }

  const handleViewAllTasks = () => {
    setView('list')
  }

  // Determine step for progress bar
  const getStep = () => {
    switch (view) {
      case 'contracts': return 1
      case 'create': return 2
      case 'monitor': return 3
      case 'list': return 0 // No step highlight for list view
      default: return 1
    }
  }

  const step = getStep()

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>ICEYE Tasking Demo</h1>
          <p>Order satellite imagery in 3 simple steps</p>
        </div>
        <button 
          className="btn btn-secondary header-btn"
          onClick={handleViewAllTasks}
        >
          View All Tasks
        </button>
      </header>

      {view !== 'list' && (
        <div className="progress-bar">
          <div className={`progress-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
            <div className="step-circle">1</div>
            <span>Select Contract</span>
          </div>
          <div className={`progress-line ${step > 1 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
            <div className="step-circle">2</div>
            <span>Create Task</span>
          </div>
          <div className={`progress-line ${step > 2 ? 'completed' : ''}`}></div>
          <div className={`progress-step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-circle">3</div>
            <span>Monitor & Download</span>
          </div>
        </div>
      )}

      <main className="main">
        {view === 'contracts' && (
          <ContractSelection onContractSelected={handleContractSelected} />
        )}
        
        {view === 'create' && (
          <TaskCreation 
            contract={selectedContract} 
            onTaskCreated={handleTaskCreated}
            onBack={() => setView('contracts')}
          />
        )}
        
        {view === 'monitor' && (
          <TaskMonitoring 
            task={selectedTask}
            onReset={handleReset}
          />
        )}

        {view === 'list' && (
          <TaskList
            onTaskSelected={handleTaskSelected}
            onCreateNew={() => setView('contracts')}
          />
        )}
      </main>

      <footer className="footer">
        <p>ICEYE Tasking Demo • <a href="https://docs.iceye.com/constellation/api/" target="_blank" rel="noopener noreferrer">Documentation</a></p>
      </footer>
    </div>
  )
}

export default App
