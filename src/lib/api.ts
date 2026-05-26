import { API_BASE_URL } from '@/lib/config';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Ensure we always use the robust 127.0.0.1 URL
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;

  const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  const headers = new Headers();
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (options.headers) {
    const customHeaders = new Headers(options.headers);
    customHeaders.forEach((value, key) => {
      headers.set(key, value);
    });
  }

  const res = await fetch(url, { ...options, headers, credentials: 'include' });
  
  // Handle 401 Unauthorized - Token expired or invalid
  if (res.status === 401) {
    // Remove expired token from localStorage
    localStorage.removeItem('access_token');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    
    // Return null to stop execution and prevent crashes
    return null;
  }
  
  // Handle other errors
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: `API Error: ${res.status}` }));
    throw new Error(errorData.detail || `API Error: ${res.status}`);
  }
  
  return res.json();
}
