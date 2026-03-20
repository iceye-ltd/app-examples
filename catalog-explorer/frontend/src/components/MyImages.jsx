import { useState, useEffect, useCallback } from 'react'
import { api } from '../lib/api'
import './MyImages.css'

function getThumbUrl(product) {
  const assets = product.assets
  if (!assets) return null
  return assets['thumbnail-png']?.href || assets['thumbnail']?.href || null
}

function getDownloadAssets(product) {
  const assets = product.assets
  if (!assets) return []
  return Object.entries(assets)
    .filter(([key, asset]) => asset.href && key !== 'thumbnail-png' && key !== 'thumbnail' && asset.type !== 'application/json')
    .map(([key, asset]) => ({ key, ...asset }))
}

function MyImages({ contracts }) {
  const [allPurchases, setAllPurchases] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [filterContractId, setFilterContractId] = useState('')
  const [expandedPurchase, setExpandedPurchase] = useState(null)
  const [purchaseProducts, setPurchaseProducts] = useState({})
  const [expandLoading, setExpandLoading] = useState(null)

  const loadPurchases = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await api.listPurchases({ limit: 50 })
      setAllPurchases(data.data || [])
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPurchases()
  }, [loadPurchases])

  const purchases = allPurchases
    ? filterContractId
      ? allPurchases.filter(p => p.contractID === filterContractId)
      : allPurchases
    : null

  async function togglePurchaseProducts(purchaseId) {
    if (expandedPurchase === purchaseId) {
      setExpandedPurchase(null)
      return
    }

    if (purchaseProducts[purchaseId]) {
      setExpandedPurchase(purchaseId)
      return
    }

    setExpandLoading(purchaseId)
    setExpandedPurchase(purchaseId)
    try {
      const data = await api.getPurchaseProducts(purchaseId)
      setPurchaseProducts(prev => ({
        ...prev,
        [purchaseId]: data.data || []
      }))
    } catch (err) {
      setError(err.message)
    } finally {
      setExpandLoading(null)
    }
  }

  function getBadgeClass(status) {
    const map = {
      active: 'badge-active',
      closed: 'badge-closed',
      received: 'badge-received',
      failed: 'badge-failed',
      canceled: 'badge-canceled',
    }
    return map[status] || ''
  }

  function formatDate(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
    })
  }

  function formatDateTime(dateStr) {
    if (!dateStr) return '-'
    return new Date(dateStr).toLocaleString('en-US', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  function getContractLabel(contractId) {
    const c = contracts.find(c => c.id === contractId)
    return c ? (c.name || c.id) : contractId
  }

  function renderProduct(product) {
    const props = product.properties || {}
    const thumbUrl = getThumbUrl(product)
    const downloadAssets = getDownloadAssets(product)

    return (
      <div key={product.id} className="product-card">
        {thumbUrl && (
          <div className="product-thumb">
            <img src={thumbUrl} alt="SAR thumbnail" loading="lazy" />
          </div>
        )}
        <div className="product-info">
          <div className="product-meta">
            <span className="product-label">Frame</span>
            <span className="product-value">{props.frame_id || '-'}</span>
          </div>
          <div className="product-meta">
            <span className="product-label">Acquired</span>
            <span className="product-value">{formatDateTime(props.start_datetime)}</span>
          </div>
          <div className="product-meta">
            <span className="product-label">Mode</span>
            <span className="product-value">{props['iceye:acquisition_mode'] || '-'}</span>
          </div>
          <div className="product-meta">
            <span className="product-label">Product</span>
            <span className="product-value">{props['sar:product_type'] || '-'}</span>
          </div>
          {props['iceye:azimuth_resolution'] && (
            <div className="product-meta">
              <span className="product-label">Resolution</span>
              <span className="product-value">{props['iceye:azimuth_resolution']} m (az)</span>
            </div>
          )}

          {downloadAssets.length > 0 && (
            <div className="product-downloads">
              <span className="product-label">Downloads</span>
              <div className="product-download-links">
                {downloadAssets.map(asset => (
                  <a
                    key={asset.key}
                    href={asset.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="download-link"
                  >
                    {asset.title || asset.key}
                  </a>
                ))}
              </div>
              <span className="download-hint">Links expire after 1 hour</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="my-images">
      <div className="my-images-header">
        <h2>Purchase History</h2>
        <div className="my-images-actions">
          <select
            className="contract-filter"
            value={filterContractId}
            onChange={e => setFilterContractId(e.target.value)}
          >
            <option value="">All contracts</option>
            {contracts.map(c => (
              <option key={c.id} value={c.id}>
                {c.name || c.id}
              </option>
            ))}
          </select>
          <button
            className="btn btn-sm btn-secondary"
            onClick={loadPurchases}
            disabled={loading}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {error && <div className="error-msg">{error}</div>}

      {loading && !allPurchases && (
        <div className="loading-inline">
          <div className="spinner" />
          <span>Loading purchases...</span>
        </div>
      )}

      {purchases && purchases.length === 0 && (
        <div className="card">
          <p className="empty-state">
            {filterContractId
              ? 'No purchases found for this contract.'
              : 'No purchases yet. Browse the public catalog to find and purchase imagery.'}
          </p>
        </div>
      )}

      {purchases && purchases.length > 0 && (
        <div className="card">
          <p className="purchases-count">
            {purchases.length} purchase{purchases.length !== 1 ? 's' : ''}
            {filterContractId && allPurchases && ` (${allPurchases.length} total)`}
          </p>
          <div className="purchase-list">
            {purchases.map(p => (
              <div key={p.id} className={`purchase-row ${expandedPurchase === p.id ? 'expanded' : ''}`}>
                <div
                  className="purchase-summary"
                  onClick={() => togglePurchaseProducts(p.id)}
                >
                  <div className="purchase-info">
                    <span className={`badge ${getBadgeClass(p.status)}`}>{p.status}</span>
                    <span className="purchase-date">{formatDate(p.createdAt)}</span>
                    <span className="purchase-frame-id">Frame {p.frameID || '-'}</span>
                    {p.reference && (
                      <span className="purchase-ref">{p.reference}</span>
                    )}
                  </div>
                  <div className="purchase-right">
                    <span className="purchase-contract">{getContractLabel(p.contractID)}</span>
                    <span className="expand-icon">
                      {expandedPurchase === p.id ? '\u25B2' : '\u25BC'}
                    </span>
                  </div>
                </div>

                {expandedPurchase === p.id && (
                  <div className="purchase-expanded">
                    {expandLoading === p.id ? (
                      <div className="products-loading">
                        <div className="spinner spinner-sm" />
                        <span>Loading products...</span>
                      </div>
                    ) : purchaseProducts[p.id] && purchaseProducts[p.id].length === 0 ? (
                      <p className="products-empty">
                        {p.status === 'closed'
                          ? 'No products found.'
                          : 'Products will be available once the purchase is completed.'}
                      </p>
                    ) : purchaseProducts[p.id] ? (
                      <div className="products-list">
                        {purchaseProducts[p.id].map(renderProduct)}
                      </div>
                    ) : null}

                    <div className="purchase-footer">
                      <span className="purchase-footer-item mono">ID: {p.id}</span>
                      {p.eula && <span className="purchase-footer-item">EULA: {p.eula}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default MyImages
