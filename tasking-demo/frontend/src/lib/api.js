// API client for backend
const API_BASE = '/api'

export const api = {
  // Contracts
  async getContracts() {
    const res = await fetch(`${API_BASE}/contracts`)
    if (!res.ok) throw new Error('Failed to fetch contracts')
    return res.json()
  },

  async getContract(contractId) {
    const res = await fetch(`${API_BASE}/contracts/${contractId}`)
    if (!res.ok) throw new Error('Failed to fetch contract')
    return res.json()
  },

  async getContractSummary(contractId) {
    const res = await fetch(`${API_BASE}/contracts/${contractId}/summary`)
    if (!res.ok) throw new Error('Failed to fetch contract summary')
    return res.json()
  },

  // Tasks
  async createTask(taskData) {
    const res = await fetch(`${API_BASE}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(taskData)
    })
    if (!res.ok) {
      const error = await res.text()
      throw new Error(error || 'Failed to create task')
    }
    return res.json()
  },

  async getTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`)
    if (!res.ok) throw new Error('Failed to fetch task')
    return res.json()
  },

  async getTaskProducts(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/products`)
    if (!res.ok) throw new Error('Failed to fetch products')
    return res.json()
  },

  async getTaskScene(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}/scene`)
    if (!res.ok) throw new Error('Failed to fetch scene')
    return res.json()
  },

  async cancelTask(taskId) {
    const res = await fetch(`${API_BASE}/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' }
    })
    if (!res.ok) throw new Error('Failed to cancel task')
    return res.json()
  }
}
