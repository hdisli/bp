import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from 'axios';
import type {
  User,
  AuthResponse,
  RefreshResponse,
  ApiResponse,
  RegisterPayload,
  LoginPayload,
  JwtPayload,
} from '../types/auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Storage keys
const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// JWT decoder (simple base64 decode)
function decodeJwt(token: string): JwtPayload | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export const useAuthStore = defineStore('auth', () => {
  // State
  const user = ref<User | null>(null);
  const accessToken = ref<string | null>(null);
  const refreshToken = ref<string | null>(null);
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // Auto-refresh interval ID
  let refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  // Computed
  const isAuthenticated = computed(() => !!accessToken.value);

  // Actions
  async function register(payload: RegisterPayload): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/api/auth/register`,
        payload
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        user.value = {
          id: data.id,
          email: data.email,
          username: data.username,
          avatarUrl: data.avatarUrl ?? null,
        };
        accessToken.value = data.accessToken;
        refreshToken.value = data.refreshToken;

        saveToStorage();
        startAutoRefresh();

        return true;
      }

      return false;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Registration failed. Please try again.';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function login(payload: LoginPayload): Promise<boolean> {
    isLoading.value = true;
    error.value = null;

    try {
      const response = await axios.post<ApiResponse<AuthResponse>>(
        `${API_URL}/api/auth/login`,
        payload
      );

      if (response.data.success && response.data.data) {
        const data = response.data.data;
        user.value = {
          id: data.id,
          email: data.email,
          username: data.username,
          avatarUrl: data.avatarUrl ?? null,
        };
        accessToken.value = data.accessToken;
        refreshToken.value = data.refreshToken;

        saveToStorage();
        startAutoRefresh();

        return true;
      }

      return false;
    } catch (err: unknown) {
      if (axios.isAxiosError(err) && err.response?.data?.error) {
        error.value = err.response.data.error.message;
      } else if (err instanceof Error) {
        error.value = err.message;
      } else {
        error.value = 'Login failed. Please check your credentials.';
      }
      return false;
    } finally {
      isLoading.value = false;
    }
  }

  async function logout(): Promise<void> {
    if (refreshToken.value) {
      try {
        await axios.post(`${API_URL}/api/auth/logout`, {
          refreshToken: refreshToken.value,
        });
      } catch {
        // Ignore logout errors, proceed with local cleanup
      }
    }

    clearAuth();
  }

  async function refreshAccessToken(): Promise<boolean> {
    if (!refreshToken.value) {
      return false;
    }

    try {
      const response = await axios.post<ApiResponse<RefreshResponse>>(
        `${API_URL}/api/auth/refresh`,
        { refreshToken: refreshToken.value }
      );

      if (response.data.success && response.data.data) {
        accessToken.value = response.data.data.accessToken;
        refreshToken.value = response.data.data.refreshToken;
        saveToStorage();
        return true;
      }

      return false;
    } catch {
      // Refresh failed, clear auth
      clearAuth();
      return false;
    }
  }

  async function loadFromStorage(): Promise<void> {
    const storedAccessToken = localStorage.getItem(ACCESS_TOKEN_KEY);
    const storedRefreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    const storedUser = localStorage.getItem(USER_KEY);

    if (storedAccessToken && storedRefreshToken) {
      // Check if access token is expired
      const payload = decodeJwt(storedAccessToken);
      if (payload && payload.exp * 1000 > Date.now()) {
        accessToken.value = storedAccessToken;
        refreshToken.value = storedRefreshToken;

        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser);
          } catch {
            user.value = {
              id: payload.sub,
              email: payload.email,
              username: payload.username,
            };
          }
        }

        startAutoRefresh();
      } else if (storedRefreshToken) {
        // Access token expired, restore user from storage while refreshing
        refreshToken.value = storedRefreshToken;
        if (storedUser) {
          try {
            user.value = JSON.parse(storedUser);
          } catch {
            // user will be set after refresh
          }
        }
        await refreshAccessToken();
      } else {
        clearAuth();
      }
    }
  }

  function saveToStorage(): void {
    if (accessToken.value) {
      localStorage.setItem(ACCESS_TOKEN_KEY, accessToken.value);
    } else {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
    }

    if (refreshToken.value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken.value);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }

    if (user.value) {
      localStorage.setItem(USER_KEY, JSON.stringify(user.value));
    } else {
      localStorage.removeItem(USER_KEY);
    }
  }

  function clearAuth(): void {
    user.value = null;
    accessToken.value = null;
    refreshToken.value = null;
    error.value = null;

    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_KEY);

    stopAutoRefresh();
  }

  function startAutoRefresh(): void {
    stopAutoRefresh();

    // Check token expiry every 30 seconds
    refreshIntervalId = setInterval(async () => {
      if (!accessToken.value) {
        return;
      }

      const payload = decodeJwt(accessToken.value);
      if (!payload) {
        return;
      }

      // Refresh 1 minute before expiry
      const expiresAt = payload.exp * 1000;
      const oneMinuteFromNow = Date.now() + 60 * 1000;

      if (expiresAt <= oneMinuteFromNow) {
        await refreshAccessToken();
      }
    }, 30 * 1000); // Check every 30 seconds
  }

  function stopAutoRefresh(): void {
    if (refreshIntervalId) {
      clearInterval(refreshIntervalId);
      refreshIntervalId = null;
    }
  }

  function clearError(): void {
    error.value = null;
  }

  // Get authorization header for API calls
  function getAuthHeader(): { Authorization: string } | Record<string, never> {
    if (accessToken.value) {
      return { Authorization: `Bearer ${accessToken.value}` };
    }
    return {};
  }

  return {
    // State
    user,
    accessToken,
    refreshToken,
    isLoading,
    error,

    // Computed
    isAuthenticated,

    // Actions
    register,
    login,
    logout,
    refreshAccessToken,
    loadFromStorage,
    saveToStorage,
    clearError,
    getAuthHeader,
    startAutoRefresh,
    stopAutoRefresh,
  };
});
