import { API_BASE_URL } from '@/lib/config';

export async function apiFetch(path: string, options: RequestInit = {}) {
  // Ensure we always use the robust 127.0.0.1 URL
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : '/' + path}`;

  const token = localStorage.getItem('access_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const res = await fetch(url, { ...options, headers });
  
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
