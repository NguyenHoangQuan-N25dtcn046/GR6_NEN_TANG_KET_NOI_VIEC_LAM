const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'
export async function apiGet(path) {
  const response = await fetch(`${API_BASE}${path}`).catch(() => {
    throw new Error('Không thể kết nối với máy chủ.')
  })
  if (!response.ok) throw new Error(`Không thể tải danh sách việc làm (HTTP ${response.status}).`)
  return response.json()
}
