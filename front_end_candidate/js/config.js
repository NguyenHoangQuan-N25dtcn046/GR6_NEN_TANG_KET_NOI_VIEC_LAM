const isLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
const isMounted = window.location.pathname.startsWith("/candidate-web/");

export const API_BASE_URL = isLocal && !isMounted
  ? "http://localhost:8000/api/v1"
  : "/api/v1";

export const WORKSPACE_BASE_URL = !isLocal ? "" : isMounted ? "http://localhost:5173" : null;
