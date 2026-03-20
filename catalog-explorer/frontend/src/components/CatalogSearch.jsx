import { useState } from 'react'
import { api } from '../lib/api'
import MapView from './MapView'
import ItemList from './ItemList'
import ItemDetail from './ItemDetail'
import './CatalogSearch.css'

function CatalogSearch({ contracts }) {
  const [results, setResults] = useState(null)
  const [cursor, setCursor] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)
  const [hoveredItemId, setHoveredItemId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const [collection, setCollection] = useState('public')
  const [contractId, setContractId] = useState(contracts[0]?.id || '')
  const [bbox, setBbox] = useState(null)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [limit, setLimit] = useState(10)

  const isPrivate = collection === 'private'

  async function handleSearch(e) {
    if (e) e.preventDefault()
    if (isPrivate && !contractId) {
      setError('Please select a contract to browse private images.')
      return
    }
    setError(null)
    setLoading(true)
    setSelectedItem(null)
    setResults(null)

    try {
      const body = { limit, collections: [collection] }

      if (contractId) {
        body.contractID = contractId
      }

      if (bbox && bbox.length === 4) {
        body.bbox = bbox
      }

      if (dateFrom && dateTo) {
        body.datetime = `${dateFrom}T00:00:00Z/${dateTo}T23:59:59Z`
      } else if (dateFrom) {
        body.datetime = `${dateFrom}T00:00:00Z/..`
      } else if (dateTo) {
        body.datetime = `../${dateTo}T23:59:59Z`
      }

      const data = await api.searchItems(body)
      setResults(data.data || [])
      setCursor(data.cursor || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMore() {
    if (!cursor) return
    setLoading(true)
    try {
      const params = { cursor, limit }
      if (isPrivate) {
        params.contractID = contractId
      }
      const data = await api.listItems(params)
      setResults(prev => [...prev, ...(data.data || [])])
      setCursor(data.cursor || null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function formatBbox() {
    if (!bbox || bbox.length !== 4) return ''
    return bbox.map(n => n.toFixed(4)).join(', ')
  }

  return (
    <div className="catalog-search">
      <div className="search-panel">
        <h2>Search the Catalog</h2>
        <form onSubmit={handleSearch}>
          <div className="form-group">
            <label>Collection</label>
            <select value={collection} onChange={e => setCollection(e.target.value)}>
              <option value="public">Public Catalog</option>
              <option value="private">My Private Images</option>
            </select>
          </div>

          {isPrivate && (
            <div className="form-group">
              <label>Contract</label>
              <select value={contractId} onChange={e => setContractId(e.target.value)}>
                {contracts.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name || c.id}
                  </option>
                ))}
              </select>
              <span className="form-hint">Required to access your private images</span>
            </div>
          )}

          <div className="form-group">
            <label>Bounding Box</label>
            {bbox && bbox.length === 4 ? (
              <div className="bbox-display">
                <span className="bbox-coords">{formatBbox()}</span>
                <button
                  type="button"
                  className="bbox-clear-btn"
                  onClick={() => setBbox(null)}
                >
                  ✕
                </button>
              </div>
            ) : (
              <span className="form-hint">Shift + drag on the map to draw a bounding box</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={e => setDateFrom(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Date To</label>
              <input
                type="date"
                value={dateTo}
                onChange={e => setDateTo(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Results per page</label>
            <select value={limit} onChange={e => setLimit(Number(e.target.value))}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Searching...' : 'Search'}
          </button>
        </form>

        {error && <div className="error-msg">{error}</div>}
      </div>

      <div className="results-panel">
        <MapView
          items={results}
          selectedItem={selectedItem}
          hoveredItemId={hoveredItemId}
          onItemSelect={setSelectedItem}
          onBboxSelect={setBbox}
          bbox={bbox}
        />

        {selectedItem ? (
          <ItemDetail
            item={selectedItem}
            contracts={contracts}
            collection={collection}
            onBack={() => setSelectedItem(null)}
          />
        ) : (
          <ItemList
            items={results}
            loading={loading}
            cursor={cursor}
            onItemSelect={setSelectedItem}
            onItemHover={setHoveredItemId}
            onLoadMore={handleLoadMore}
          />
        )}
      </div>
    </div>
  )
}

export default CatalogSearch
