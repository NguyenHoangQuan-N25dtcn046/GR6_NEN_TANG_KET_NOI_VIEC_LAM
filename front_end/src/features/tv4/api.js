const base = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '')

export async function request(path, { token, method = 'GET', data, signal, file = false } = {}) {
  const headers = {}
  if (token) headers.Authorization = 'Bearer ' + token
  if (data !== undefined) headers['Content-Type'] = 'application/json'
  const response = await fetch(base + path, { method, headers, signal, body: JSON.stringify(data) })
  if (!response.ok) {
    const problem = await response.json().catch(() => ({}))
    const fields = problem.errors?.map(error => error.location.slice(1).join('.') + ': ' + error.message)
    const error = new Error(fields?.length ? fields.join(' · ') : (problem.detail || 'Request failed (' + response.status + ').'))
    error.status = response.status
    throw error
  }
  if (response.status === 204) return
  return file ? response.blob() : response.json()
}
