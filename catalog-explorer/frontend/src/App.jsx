import { useState, useEffect } from 'react'
import { api } from './lib/api'
import CatalogSearch from './components/CatalogSearch'
import MyImages from './components/MyImages'
import './App.css'

function App() {
  const [tab, setTab] = useState('explore')
  const [contracts, setContracts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    loadContracts()
  }, [])

  async function loadContracts() {
    try {
      setLoading(true)
      const data = await api.getContracts()
      const contractList = data.data || data || []
      setContracts(contractList)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <div className="spinner" />
          <p>Connecting to ICEYE API...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="app">
        <div className="error-screen">
          <h2>Connection Error</h2>
          <p>{error}</p>
          <p className="hint">Make sure the backend is running on port 8000 and your .env is configured.</p>
          <button className="btn btn-primary" onClick={loadContracts}>Retry</button>
        </div>
      </div>
    )
  }

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <h1>ICEYE Catalog Explorer</h1>
          <p>Browse, search, and purchase satellite imagery</p>
        </div>
      </header>

      <nav className="tab-nav">
        <button
          className={`tab-btn ${tab === 'explore' ? 'active' : ''}`}
          onClick={() => setTab('explore')}
        >
          Explore Catalog
        </button>
        <button
          className={`tab-btn ${tab === 'my-images' ? 'active' : ''}`}
          onClick={() => setTab('my-images')}
        >
          Purchase History
        </button>
      </nav>

      <main className="main">
        {tab === 'explore' && (
          <CatalogSearch contracts={contracts} />
        )}
        {tab === 'my-images' && (
          <MyImages contracts={contracts} />
        )}
      </main>

      <footer className="footer">
        <p>
          ICEYE Catalog Explorer &bull;{' '}
          <a href="https://docs.iceye.com/constellation/api/" target="_blank" rel="noopener noreferrer">
            API Documentation
          </a>
        </p>
      </footer>
    </div>
  )
}

export default App
