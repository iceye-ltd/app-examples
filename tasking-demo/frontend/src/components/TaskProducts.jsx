import { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { api } from '../lib/api'
import './TaskMonitoring.css'

/**
 * Displays and manages task products (imagery files).
 * Automatically loads products when task reaches FULFILLED or DONE status.
 */
function TaskProducts({ taskId, taskStatus }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const isCompleted = ['FULFILLED', 'DONE'].includes(taskStatus)
  const hasMoreProductsComing = taskStatus === 'FULFILLED' // FULFILLED = SLA products ready, DONE = all products ready

  // Load products when task reaches FULFILLED or DONE status
  useEffect(() => {
    if (isCompleted) {
      loadProducts()
    }
  }, [taskId, taskStatus])

  const loadProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.getTaskProducts(taskId)
      setProducts(response.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Don't render anything if task isn't completed yet
  if (!isCompleted) {
    return null
  }

  return (
    <div className="products-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Available Products</h3>
        {hasMoreProductsComing && (
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#f59e0b', 
            fontWeight: '500',
            background: '#fef3c7',
            padding: '0.25rem 0.75rem',
            borderRadius: '6px'
          }}>
            Processing additional products...
          </span>
        )}
        {taskStatus === 'DONE' && (
          <span style={{ 
            fontSize: '0.875rem', 
            color: '#10b981', 
            fontWeight: '500',
            background: '#d1fae5',
            padding: '0.25rem 0.75rem',
            borderRadius: '6px'
          }}>
            Complete
          </span>
        )}
      </div>
      
      {loading && (
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading products...</p>
        </div>
      )}

      {error && (
        <div className="error">
          <strong>Error loading products:</strong> {error}
          <button className="btn btn-secondary" onClick={loadProducts} style={{ marginTop: '10px' }}>
            Retry
          </button>
        </div>
      )}

      {!loading && !error && products.length === 0 && (
        <p className="no-products">No products available yet.</p>
      )}

      {!loading && products.length > 0 && (
        <div className="products-grid">
          {products.map((product) => {
            const props = product.properties || {}
            const productType = props['sar:product_type'] || 'Unknown'
            const created = props.created
            const frameId = props.frame_id
            const assetCount = product.assets ? Object.keys(product.assets).length : 0
            
            return (
              <div key={product.id} className="product-item">
                <div className="product-header">
                  <span className="product-type">{productType}</span>
                  <span className="product-size">
                    {assetCount} {assetCount === 1 ? 'file' : 'files'}
                  </span>
                </div>
                <div className="product-meta">
                  {created && <span>Created: {new Date(created).toLocaleString()}</span>}
                  {frameId && <span>Frame: {frameId}</span>}
                </div>
                {product.assets && (
                  <div className="product-assets">
                    {Object.entries(product.assets).map(([assetKey, asset]) => (
                      <a 
                        key={assetKey}
                        href={asset.href} 
                        className="btn btn-secondary product-download"
                        download
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        {asset.title || assetKey}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

TaskProducts.propTypes = {
  taskId: PropTypes.string.isRequired,
  taskStatus: PropTypes.string.isRequired,
}

export default TaskProducts
