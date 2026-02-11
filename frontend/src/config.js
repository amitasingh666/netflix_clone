/**
 * Central API base URL for backend requests.
 * Set VITE_API_BASE_URL in .env for deployment (e.g. https://api.yoursite.com).
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
