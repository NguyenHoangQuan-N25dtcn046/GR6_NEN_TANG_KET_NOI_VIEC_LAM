const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`)
  if (!response.ok) throw new Error(`API error ${response.status}`)
  return response.json()
}
