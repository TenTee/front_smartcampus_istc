import axios from 'axios';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://istc.tenteeglobal.com/';

export function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://')) return path.replace('http://', 'https://');
  if (path.startsWith('http')) return path;
  return `${API_BASE_URL.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const academicYearId = localStorage.getItem('selectedAcademicYearId');
    if (academicYearId) {
      config.headers['X-Academic-Year'] = academicYearId;
    }
  }

  return config;
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (token) prom.resolve(token);
    else prom.reject(error);
  });
  failedQueue = [];
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      typeof window === 'undefined' ||
      window.location.pathname.startsWith('/login')
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('selectedAcademicYearId');
        document.cookie = 'token=; Max-Age=-99999999; path=/';
        window.location.replace('/login');
        return Promise.reject(error);
      }

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(token => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        }).catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post(`${API_BASE_URL}api/auth/token/refresh/`, { refresh: refreshToken });
        const newToken = data.access;
        localStorage.setItem('token', newToken);
        document.cookie = `token=${newToken}; path=/; max-age=${6 * 60 * 60}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        localStorage.removeItem('user_role');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('selectedAcademicYearId');
        document.cookie = 'token=; Max-Age=-99999999; path=/';
        window.location.replace('/login');
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    if (
      error.response?.status === 403 &&
      !window.location.pathname.startsWith('/login')
    ) {
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      localStorage.removeItem('user_role');
      localStorage.removeItem('loginTime');
      localStorage.removeItem('selectedAcademicYearId');
      document.cookie = 'token=; Max-Age=-99999999; path=/';
      window.location.replace('/login');
    }

    return Promise.reject(error);
  }
);

export function getApiErrorMessage(error, fallback = "Une erreur est survenue.") {
  const extractMessage = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (Array.isArray(value)) {
      for (const item of value) {
        const message = extractMessage(item);
        if (message) return message;
      }
      return null;
    }
    if (typeof value === 'object') {
      if (typeof value.detail === 'string') return value.detail;
      if (typeof value.message === 'string') return value.message;
      for (const nestedValue of Object.values(value)) {
        const message = extractMessage(nestedValue);
        if (message) return message;
      }
    }
    return null;
  };

  if (error?.response?.data) {
    const data = error.response.data;

    // Friendly mapping for DB unique constraint returned as non_field_errors
    const nonField = data.non_field_errors;
    if (nonField) {
      const joined = Array.isArray(nonField) ? nonField.join(' ') : String(nonField);
      if (/must make a unique set/i.test(joined) || /unique set/i.test(joined)) {
        return "Une filière avec ce nom existe déjà dans ce département.";
      }
    }

    const message = extractMessage(data);
    if (message) return message;
  }
  return fallback;
}

export async function apiRequest(config) {
  if (typeof window === 'undefined') {
    return null;
  }
  const response = await apiClient.request(config);
  return response.data;
}
