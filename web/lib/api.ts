import axios from 'axios';
import { getPublicApiBaseUrl } from '@/lib/api-base';
import {
  getActiveCompanyHeaderValue,
} from '@/lib/active-company-storage';
import {
  clearSessionAndRedirectToLogin,
  isSkippableAuthRetryUrl,
  refreshAccessToken,
} from '@/lib/auth-session';
import { isLogoutInProgress } from '@/lib/logout';

const api = axios.create({
    baseURL: getPublicApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to headers
api.interceptors.request.use(
  (config) => {
    if (isLogoutInProgress()) {
      return Promise.reject(new axios.CanceledError('logout'));
    }
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const userRaw = localStorage.getItem('user');
      let isSuperAdmin = false;
      if (userRaw) {
        try {
          const parsed = JSON.parse(userRaw) as { roles?: string[] };
          isSuperAdmin = parsed.roles?.includes('SuperAdmin') ?? false;
        } catch {
          /* ignore */
        }
      }
      const explicitCompany = config.params?.companyId ?? (config.data && typeof config.data === 'object' ? config.data.companyId : undefined);
      const companyId = typeof explicitCompany === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(explicitCompany)
        ? explicitCompany : getActiveCompanyHeaderValue(isSuperAdmin);
      if (companyId) {
        config.headers['X-Company-Id'] = companyId;
      } else {
        delete config.headers['X-Company-Id'];
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (isLogoutInProgress() || axios.isCancel(error)) {
      return Promise.reject(error);
    }
    const originalRequest = error.config;
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isSkippableAuthRetryUrl(originalRequest.url)
    ) {
      originalRequest._retry = true;
      if (typeof window === 'undefined') {
        return Promise.reject(error);
      }

      const hadRefreshToken = !!localStorage.getItem('refreshToken');
      const token = await refreshAccessToken();
      if (token) {
        originalRequest.headers = originalRequest.headers ?? {};
        originalRequest.headers.Authorization = `Bearer ${token}`;
        api.defaults.headers.common.Authorization = `Bearer ${token}`;
        return api(originalRequest);
      }

      if (hadRefreshToken) {
        clearSessionAndRedirectToLogin();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
