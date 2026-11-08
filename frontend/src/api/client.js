const API_BASE = import.meta.env.VITE_API_URL || ''

const TOKEN_KEY = 'joblink_token'
const ROLE_KEY = 'joblink_role'

export function getToken() {
  return localStorage.getItem(TOKEN_KEY)
}

export function getRole() {
  return localStorage.getItem(ROLE_KEY)
}

export function setAuth(token, role) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(ROLE_KEY, role)
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(ROLE_KEY)
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`

  let payload
  if (formData) {
    payload = formData
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }

  const res = await fetch(`${API_BASE}${path}`, { method, headers, body: payload })

  if (res.status === 401 && token) {
    clearAuth()
    if (!window.location.pathname.startsWith('/login')) {
      window.location.href = '/login'
    }
  }

  if (!res.ok) {
    let detail = `Lỗi ${res.status}`
    try {
      const data = await res.json()
      if (data.detail) {
        detail = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail)
      }
    } catch {
      /* ignore */
    }
    throw new Error(detail)
  }

  if (res.status === 204) return null
  return res.json()
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body }),
  put: (path, body) => request(path, { method: 'PUT', body }),
  patch: (path, body) => request(path, { method: 'PATCH', body }),
  upload: (path, formData) => request(path, { method: 'POST', formData }),
}

export const authApi = {
  register: (payload) => api.post('/api/auth/register', payload),
  login: (payload) => api.post('/api/auth/login', payload),
  changePassword: (payload) => api.post('/api/auth/change-password', payload),
}

export const jobsApi = {
  list: (params = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v !== '' && v != null),
    ).toString()
    return api.get(`/api/jobs${qs ? `?${qs}` : ''}`)
  },
  detail: (id) => api.get(`/api/jobs/${id}`),
  create: (payload) => api.post('/api/jobs', payload),
  update: (id, payload) => api.put(`/api/jobs/${id}`, payload),
  close: (id) => api.patch(`/api/jobs/${id}/close`),
  apply: (id, payload) => api.post(`/api/jobs/${id}/apply`, payload),
}

export const candidateApi = {
  profile: () => api.get('/api/candidate/profile'),
  updateProfile: (payload) => api.put('/api/candidate/profile', payload),
  uploadCv: (formData) => api.upload('/api/candidate/cv', formData),
  applications: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/candidate/applications${qs ? `?${qs}` : ''}`)
  },
}

export const employerApi = {
  company: () => api.get('/api/employer/company'),
  updateCompany: (payload) => api.put('/api/employer/company', payload),
  jobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/employer/jobs${qs ? `?${qs}` : ''}`)
  },
  applications: (jobId) => api.get(`/api/employer/jobs/${jobId}/applications`),
  updateApplicationStatus: (id, status) =>
    api.patch(`/api/applications/${id}/status`, { status }),
  updateJobStatus: (id, status) => api.patch(`/api/employer/jobs/${id}/status`, { status }),
}

export const adminApi = {
  jobs: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/admin/jobs${qs ? `?${qs}` : ''}`)
  },
  reviewJob: (id, status) => api.patch(`/api/admin/jobs/${id}/status`, { status }),
  users: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return api.get(`/api/admin/users${qs ? `?${qs}` : ''}`)
  },
  lockUser: (id) => api.patch(`/api/admin/users/${id}/lock`),
  unlockUser: (id) => api.patch(`/api/admin/users/${id}/unlock`),
  stats: () => api.get('/api/admin/stats'),
}
