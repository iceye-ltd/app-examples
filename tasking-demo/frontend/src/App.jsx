import { useState } from 'react'
import ContractSelection from './components/ContractSelection'
import TaskCreation from './components/TaskCreation'
import TaskMonitoring from './components/TaskMonitoring'
import './App.css'

function App() {
  const [step, setStep] = useState(1) // 1: contracts, 2: create task, 3: monitor
  const [selectedContract, setSelectedContract] = useState(null)
  const [createdTask, setCreatedTask] = useState(null)

  const handleContractSelected = (contract) => {
    setSelectedContract(contract)
    setStep(2)
  }

  const handleTaskCreated = (task) => {
    setCreatedTask(task)
    setStep(3)
  }

  const handleReset = () => {
    setStep(1)
    setSelectedContract(null)
    setCreatedTask(null)
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>ICEYE Tasking Demo</h1>
          <p>Order satellite imagery in 3 simple steps</p>
        </div>
      </header>

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

      <main className="main">
        {step === 1 && (
          <ContractSelection onContractSelected={handleContractSelected} />
        )}
        
        {step === 2 && (
          <TaskCreation 
            contract={selectedContract} 
            onTaskCreated={handleTaskCreated}
            onBack={() => setStep(1)}
          />
        )}
        
        {step === 3 && (
          <TaskMonitoring 
            task={createdTask}
            onReset={handleReset}
          />
        )}
      </main>

      <footer className="footer">
        <p>ICEYE Tasking Demo • <a href="https://docs.iceye.com/constellation/api/" target="_blank">Documentation</a></p>
      </footer>
    </div>
  )
}

export default App
