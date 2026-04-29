const API_BASE = '/api'

async function handleResponse(res, errorMsg) {
  const text = await res.text()
  if (!res.ok) {
    let message = errorMsg
    try {
      const data = JSON.parse(text)
      message = data.detail || data.message || data.error || JSON.stringify(data)
    } catch {
      message = text || errorMsg
    }
    throw new Error(message)
  }
  return JSON.parse(text)
}

export const api = {
  async getContracts() {
    const res = await fetch(`${API_BASE}/contracts`)
    return handleResponse(res, 'Failed to fetch contracts')
  },

  async listItems(params = {}) {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.set('limit', params.limit)
    if (params.cursor) searchParams.set('cursor', params.cursor)
    if (params.bbox) searchParams.set('bbox', params.bbox)
    if (params.datetime) searchParams.set('datetime', params.datetime)
    if (params.collections) searchParams.set('collections', params.collections)
    if (params.contractID) searchParams.set('contractID', params.contractID)

    const qs = searchParams.toString()
    const res = await fetch(`${API_BASE}/catalog/items${qs ? '?' + qs : ''}`)
    return handleResponse(res, 'Failed to list catalog items')
  },

  async searchItems(body) {
    const res = await fetch(`${API_BASE}/catalog/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    return handleResponse(res, 'Catalog search failed')
  },

  async getFramePrice(contractID, frameID, eula = 'STANDARD') {
    const params = new URLSearchParams({ contractID, frameID, eula })
    const res = await fetch(`${API_BASE}/catalog/price?${params}`)
    return handleResponse(res, 'Failed to get frame price')
  },

  async purchaseFrame(data) {
    const res = await fetch(`${API_BASE}/purchases`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    return handleResponse(res, 'Failed to purchase frame')
  },

  async listPurchases(params = {}) {
    const searchParams = new URLSearchParams()
    if (params.limit) searchParams.set('limit', params.limit)
    if (params.cursor) searchParams.set('cursor', params.cursor)

    const qs = searchParams.toString()
    const res = await fetch(`${API_BASE}/purchases${qs ? '?' + qs : ''}`)
    return handleResponse(res, 'Failed to list purchases')
  },

  async getPurchase(purchaseId) {
    const res = await fetch(`${API_BASE}/purchases/${purchaseId}`)
    return handleResponse(res, 'Failed to get purchase')
  },

  async getPurchaseProducts(purchaseId) {
    const res = await fetch(`${API_BASE}/purchases/${purchaseId}/products`)
    return handleResponse(res, 'Failed to get purchase products')
  },
}
