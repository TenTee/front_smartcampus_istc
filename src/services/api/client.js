import axios from 'axios';

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000/').replace(/\/$/, '');

export function getMediaUrl(path) {
  if (!path) return null;
  if (path.startsWith('http://')) {
    const url = new URL(path);
    const isLocalHost = ['localhost', '127.0.0.1'].includes(url.hostname);
    if (typeof window !== 'undefined' && window.location.protocol === 'https:' && !isLocalHost) {
      url.protocol = 'https:';
    }
    return url.toString();
  }
  if (path.startsWith('https://')) return path;
  return `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
});


apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    const requestUrl = config.url || '';
    const isAuthRoute = requestUrl.includes('/api/auth/login/') || requestUrl.includes('/api/auth/token/refresh/');

    // Pas de jeton sur la connexion : un ancien jeton expiré resté en mémoire faisait
    // répondre 401 au login lui-même, empêchant de se reconnecter.
    if (token && !isAuthRoute) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const academicYearId = localStorage.getItem('selectedAcademicYearId');
    if (!isAuthRoute && academicYearId) {
      config.headers['X-Academic-Year'] = academicYearId;
    }
  }

  return config;
});

// Clés de session stockées côté navigateur. Une seule fonction pour tout nettoyer :
// la déconnexion était dupliquée dans 9 fichiers, chacun oubliant des clés différentes
// (is_formateur, user_permissions…), si bien qu'un utilisateur suivant héritait de flags
// du précédent sur le même navigateur.
const SESSION_KEYS = [
  'token',
  'refreshToken',
  'user',
  'user_role',
  'user_permissions',
  'is_formateur',
  'is_coordonnateur',
  'loginTime',
  'selectedAcademicYearId',
  'selectedAcademicYearLibelle',
];

export function clearSession() {
  if (typeof window === 'undefined') return;
  SESSION_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {}
  });
  document.cookie = 'token=; Max-Age=-99999999; path=/';
}

function redirectToLogin() {
  clearSession();
  if (!window.location.pathname.startsWith('/login')) {
    window.location.replace('/login');
  }
}

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
    const originalRequest = error.config || {};

    const pathname = typeof window !== 'undefined' ? window.location.pathname : '';
    const isPublicPage =
      typeof window === 'undefined' ||
      pathname.startsWith('/login') ||
      pathname.startsWith('/preinscription');

    if (isPublicPage) {
      // Pages publiques (login, pré-inscription) : un jeton périmé resté en mémoire fait
      // échouer en 401 des routes pourtant publiques (thème, filières…). On réessaie sans jeton.
      if (error.response?.status === 401 && originalRequest.headers?.Authorization && !originalRequest._sansJeton) {
        originalRequest._sansJeton = true;
        delete originalRequest.headers.Authorization;
        localStorage.removeItem('token');
        return apiClient(originalRequest);
      }
      return Promise.reject(error);
    }

    // 401 = jeton absent/expiré : on tente un rafraîchissement, sinon retour au login.
    // (Un 403 = droit insuffisant sur une ressource : ce n'est PAS une raison de déconnecter
    // l'utilisateur. Auparavant tout 403 vidait la session, ce qui expulsait par exemple un
    // formateur non coordonnateur ou un utilisateur sans droit sur un widget.)
    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        redirectToLogin();
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
        // API_BASE_URL n'a pas de « / » final : l'ancienne URL donnait
        // « http://127.0.0.1:8000api/auth/... », le rafraîchissement échouait toujours
        // et l'utilisateur était déconnecté à chaque expiration du jeton.
        const { data } = await axios.post(`${API_BASE_URL}/api/auth/token/refresh/`, { refresh: refreshToken });
        const newToken = data.access;
        localStorage.setItem('token', newToken);
        document.cookie = `token=${newToken}; path=/; max-age=${6 * 60 * 60}`;
        apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        redirectToLogin();
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
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
      if (/unique set/i.test(joined)) {
        return "Cet enregistrement existe déjà (doublon).";
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
  try {
    const response = await apiClient.request(config);
    return response.data;
  } catch (error) {
    const shouldIgnoreAuthError = [401, 403].includes(error?.response?.status);

    if (!shouldIgnoreAuthError) {
      try {
        const base = (apiClient.defaults && apiClient.defaults.baseURL) || '';
        const path = config && config.url ? config.url : '';
        const url = path.startsWith('http') ? path : `${base.replace(/\/$/, '')}${path.startsWith('/') ? '' : '/'}${path}`;
        console.error('API request failed:', {
          url,
          method: config && config.method ? config.method : 'GET',
          message: error?.message,
          isAxiosError: error?.isAxiosError,
          status: error?.response?.status,
        });
      } catch (e) {
        console.error('API request failed (error computing URL):', e);
      }
    }
    throw error;
  }
}
