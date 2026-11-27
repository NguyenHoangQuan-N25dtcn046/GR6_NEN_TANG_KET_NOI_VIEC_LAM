// Local development uses separate ports; a deployed site uses same-origin URLs.
const localDev = ['localhost', '127.0.0.1'].includes(window.location.hostname)
  && ['5173', '5174', '5500', '5501'].includes(window.location.port);
export const API_BASE_URL = localDev ? `${window.location.protocol}//${window.location.hostname}:8000/api/v1` : '/api/v1';
export const WORKSPACE_URL = localDev ? `${window.location.protocol}//${window.location.hostname}:5173` : '';
