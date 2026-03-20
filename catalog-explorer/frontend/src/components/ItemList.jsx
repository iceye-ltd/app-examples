import './ItemList.css'

function getThumbnailUrl(item) {
  const assets = item.assets
  if (!assets) return null
  const thumb = assets['thumbnail-png'] || assets['thumbnail']
  return thumb?.href || null
}

function ItemList({ items, loading, cursor, onItemSelect, onItemHover, onLoadMore }) {
  if (!items) {
    return (
      <div className="item-list card">
        <p className="empty-state">Use the search form to find satellite imagery in the ICEYE catalog.</p>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="item-list card">
        <p className="empty-state">No results found. Try adjusting your search filters.</p>
      </div>
    )
  }

  return (
    <div className="item-list card">
      <h3>{items.length} result{items.length !== 1 ? 's' : ''}</h3>
      <div className="item-grid">
        {items.map(item => {
          const thumbUrl = getThumbnailUrl(item)
          return (
            <div
              key={item.id}
              className="item-card"
              onClick={() => onItemSelect(item)}
              onMouseEnter={() => onItemHover?.(item.id)}
              onMouseLeave={() => onItemHover?.(null)}
            >
              {thumbUrl && (
                <div className="item-thumb">
                  <img src={thumbUrl} alt="SAR thumbnail" loading="lazy" />
                </div>
              )}
              <div className="item-card-content">
                <div className="item-card-header">
                  <span className="item-frame">{item.properties?.frame_id || item.id.slice(0, 12)}</span>
                  <span className="badge badge-mode">
                    {item.properties?.['iceye:processing_mode'] || '?'}
                  </span>
                </div>
                <div className="item-card-body">
                  <div className="item-meta">
                    <span>Type: {item.properties?.['sar:product_type'] || '-'}</span>
                    <span>Mode: {item.properties?.['iceye:acquisition_mode'] || '-'}</span>
                  </div>
                  <div className="item-date">
                    {item.properties?.start_datetime
                      ? new Date(item.properties.start_datetime).toLocaleDateString('en-US', {
                          year: 'numeric', month: 'short', day: 'numeric'
                        })
                      : '-'
                    }
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {cursor && (
        <div className="load-more">
          <button
            className="btn btn-secondary"
            onClick={onLoadMore}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  )
}

export default ItemList
