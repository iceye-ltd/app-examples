import { useState, useEffect } from 'react'
import { api } from '../lib/api'
import './ItemDetail.css'

function getDownloadableAssets(item) {
  const assets = item.assets
  if (!assets) return []
  return Object.entries(assets)
    .filter(([, asset]) => asset.href && asset.type !== 'application/json')
    .map(([key, asset]) => ({ key, ...asset }))
}

function ItemDetail({ item, contracts, collection, onBack }) {
  const [purchaseContractId, setPurchaseContractId] = useState(contracts[0]?.id || '')
  const [price, setPrice] = useState(null)
  const [priceLoading, setPriceLoading] = useState(false)
  const [purchasing, setPurchasing] = useState(false)
  const [purchaseResult, setPurchaseResult] = useState(null)
  const [error, setError] = useState(null)
  const [lightboxOpen, setLightboxOpen] = useState(false)

  const isPrivate = collection === 'private'

  useEffect(() => {
    setPrice(null)
    setPurchaseResult(null)
    setError(null)
    setLightboxOpen(false)
  }, [item])

  // Reset price when the user switches contract for purchase
  useEffect(() => {
    setPrice(null)
    setError(null)
  }, [purchaseContractId])

  useEffect(() => {
    if (!lightboxOpen) return
    function onKey(e) {
      if (e.key === 'Escape') setLightboxOpen(false)
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [lightboxOpen])

  const props = item.properties || {}
  const frameId = props.frame_id
  const thumbUrl = item.assets?.['thumbnail-png']?.href || item.assets?.['thumbnail']?.href || null
  const downloadAssets = isPrivate ? getDownloadableAssets(item) : []

  async function handleGetPrice() {
    if (!purchaseContractId || !frameId) return
    setPriceLoading(true)
    setError(null)
    try {
      const data = await api.getFramePrice(purchaseContractId, frameId)
      setPrice(data)
    } catch (err) {
      const msg = err.message || ''
      if (
        msg.includes('no Pricing Plan') ||
        msg.includes('not allowed to query price') ||
        msg.includes('OUT_OF_BOUND_CONTRACT') ||
        msg.includes('Invalid Contract')
      ) {
        setPrice({ unavailable: true })
      } else {
        setError(msg)
      }
    } finally {
      setPriceLoading(false)
    }
  }

  async function handlePurchase() {
    if (!purchaseContractId || !frameId) return
    const confirmed = window.confirm(
      `Purchase frame ${frameId}? This action cannot be undone.`
    )
    if (!confirmed) return
    setPurchasing(true)
    setError(null)
    try {
      const data = await api.purchaseFrame({
        contractID: purchaseContractId,
        frameID: frameId,
        eula: 'STANDARD',
      })
      setPurchaseResult(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setPurchasing(false)
    }
  }

  function formatCurrency(amount, currency) {
    const majorUnit = amount / 100
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'USD',
    }).format(majorUnit)
  }

  function getContractLabel(c) {
    return c.name || c.id
  }

  return (
    <div className="item-detail card">
      <div className="detail-header">
        <button className="btn btn-sm btn-secondary" onClick={onBack}>
          &larr; Back to results
        </button>
        <h3>Item Details</h3>
        {isPrivate && <span className="badge badge-owned">Owned</span>}
      </div>

      {thumbUrl && (
        <>
          <div className="detail-thumbnail" onClick={() => setLightboxOpen(true)}>
            <img src={thumbUrl} alt="SAR thumbnail" />
            <span className="zoom-hint">Click to zoom</span>
          </div>
          {lightboxOpen && (
            <div className="lightbox-overlay" onClick={() => setLightboxOpen(false)}>
              <button className="lightbox-close">&times;</button>
              <img
                src={thumbUrl}
                alt="SAR thumbnail full size"
                className="lightbox-img"
                onClick={e => e.stopPropagation()}
              />
            </div>
          )}
        </>
      )}

      <div className="detail-grid">
        <div className="detail-section">
          <h4>Identification</h4>
          <table className="detail-table">
            <tbody>
              <tr><td>Item ID</td><td className="mono">{item.id}</td></tr>
              <tr><td>Frame ID</td><td>{frameId || '-'}</td></tr>
              <tr><td>Collection</td><td>{isPrivate ? 'Private (owned)' : 'Public'}</td></tr>
            </tbody>
          </table>
        </div>

        <div className="detail-section">
          <h4>Acquisition</h4>
          <table className="detail-table">
            <tbody>
              <tr><td>Mode</td><td>{props['iceye:acquisition_mode'] || '-'}</td></tr>
              <tr><td>Processing</td><td>{props['iceye:processing_mode'] || '-'}</td></tr>
              <tr><td>Product Type</td><td>{props['sar:product_type'] || '-'}</td></tr>
              <tr><td>Orbit</td><td>{props['sat:orbit_state'] || '-'}</td></tr>
              <tr><td>Look Side</td><td>{props['sar:observation_direction'] || '-'}</td></tr>
              <tr>
                <td>Acquired</td>
                <td>
                  {props.start_datetime
                    ? new Date(props.start_datetime).toLocaleString()
                    : '-'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="detail-section">
          <h4>Resolution</h4>
          <table className="detail-table">
            <tbody>
              <tr><td>Azimuth</td><td>{props['iceye:azimuth_resolution'] ? `${props['iceye:azimuth_resolution']} m` : '-'}</td></tr>
              <tr><td>Range (center)</td><td>{props['iceye:range_resolution_center'] ? `${props['iceye:range_resolution_center']} m` : '-'}</td></tr>
              <tr><td>Incidence (center)</td><td>{props['iceye:incidence_center'] ? `${props['iceye:incidence_center']}°` : '-'}</td></tr>
              <tr><td>Look Angle</td><td>{props['iceye:satellite_look_angle'] ? `${props['iceye:satellite_look_angle']}°` : '-'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {item.bbox && (
        <div className="detail-section">
          <h4>Bounding Box</h4>
          <p className="mono bbox-text">
            [{item.bbox.map(v => v.toFixed(4)).join(', ')}]
          </p>
        </div>
      )}

      {/* Private images: show available assets */}
      {isPrivate && downloadAssets.length > 0 && (
        <div className="assets-section">
          <h4>Available Assets</h4>
          <div className="assets-list">
            {downloadAssets.map(asset => (
              <a
                key={asset.key}
                href={asset.href}
                target="_blank"
                rel="noopener noreferrer"
                className="asset-link"
              >
                <span className="asset-title">{asset.title || asset.key}</span>
                <span className="asset-type">{asset.type}</span>
              </a>
            ))}
          </div>
          <p className="asset-hint">Download links expire after 1 hour.</p>
        </div>
      )}

      {/* Public images: purchase workflow */}
      {!isPrivate && frameId && !purchaseResult && (
        <div className="purchase-section">
          <h4>Purchase this Frame</h4>

          <div className="purchase-contract-row">
            <label>Contract</label>
            <select
              value={purchaseContractId}
              onChange={e => setPurchaseContractId(e.target.value)}
            >
              {contracts.map(c => (
                <option key={c.id} value={c.id}>{getContractLabel(c)}</option>
              ))}
            </select>
          </div>

          <div className="purchase-actions">
            <div className="price-row">
              {!price ? (
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={handleGetPrice}
                  disabled={priceLoading || !purchaseContractId}
                >
                  {priceLoading ? 'Checking price...' : 'Check Price'}
                </button>
              ) : price.unavailable ? (
                <p className="price-unavailable">
                  Price not available for this contract.
                </p>
              ) : (
                <span className="price-amount">{formatCurrency(price.amount, price.currency)}</span>
              )}
            </div>

            <button
              className="btn btn-success"
              onClick={handlePurchase}
              disabled={purchasing || !purchaseContractId}
            >
              {purchasing ? 'Purchasing...' : 'Purchase'}
            </button>
          </div>
        </div>
      )}

      {purchaseResult && (
        <div className="purchase-success">
          <h4>Purchase Successful</h4>
          <p>Purchase ID: <span className="mono">{purchaseResult.id}</span></p>
          <p>Status: <span className={`badge badge-${purchaseResult.status}`}>{purchaseResult.status}</span></p>
        </div>
      )}

      {error && <div className="error-msg">{error}</div>}
    </div>
  )
}

export default ItemDetail
