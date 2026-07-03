import { getAdminAccessToken } from './auth';

const rawApiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.VITE_API_URL ||
  ''
).trim();

const normalizedApiBaseUrl = rawApiBaseUrl.replace(/\/+$/, '');

export const API_BASE_URL = normalizedApiBaseUrl;

const isAbsoluteUrl = (value: string) => /^[a-z][a-z\d+\-.]*:\/\//i.test(value);

export const apiUrl = (path: string) => {
  if (!path) {
    return API_BASE_URL || '';
  }

  if (isAbsoluteUrl(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
};

export const assetUrl = (path: string | null | undefined) => {
  if (!path) {
    return '';
  }

  return apiUrl(path);
};

export const authFetch = (path: string, init: RequestInit = {}) => {
  const token = getAdminAccessToken();
  const headers = new Headers(init.headers || {});

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  return fetch(apiUrl(path), {
    ...init,
    headers,
  });
};
