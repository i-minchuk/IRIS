import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAuthStore, DEMO_CREDENTIALS } from './authStore';

vi.mock('../api/authApi', () => ({
  authApi: {
    getCurrentUser: vi.fn(),
    login: vi.fn(),
  },
}));

vi.mock('@/shared/api/authEvents', () => ({
  authEvents: {
    onLogout: vi.fn(),
    emitLogout: vi.fn(),
  },
}));

import { authApi } from '../api/authApi';

describe('useAuthStore', () => {
  beforeEach(() => {
    localStorage.clear();
    useAuthStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      hasHydrated: true,
      isDemoMode: false,
    });
    vi.clearAllMocks();
  });

  it('initial state without token', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(state.isLoading).toBe(false);
  });

  it('setAuth stores user, token and updates state', () => {
    const user = { id: 1, email: 'test@example.com', full_name: 'Test', role: 'engineer' as const, is_active: true };
    useAuthStore.getState().setAuth(user, 'token_123');

    const state = useAuthStore.getState();
    expect(state.user).toEqual(user);
    expect(state.token).toBe('token_123');
    expect(state.isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token_123');
  });

  it('logout clears everything', () => {
    useAuthStore.getState().setAuth(
      { id: 1, email: 'test@example.com', full_name: 'Test', role: 'engineer' as const, is_active: true },
      'token_123'
    );
    useAuthStore.getState().logout();

    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.token).toBeNull();
    expect(state.isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  describe('checkAuth', () => {
    it('authenticates when token is valid', async () => {
      localStorage.setItem('access_token', 'valid_token');
      const apiUser = { id: 1, email: 'test@example.com', full_name: 'Test', role: 'engineer', is_active: true };
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(apiUser);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.user?.email).toBe('test@example.com');
      expect(state.isAuthenticated).toBe(true);
      expect(state.isLoading).toBe(false);
    });

    it('logs out on 401', async () => {
      localStorage.setItem('access_token', 'bad_token');
      const err = { response: { status: 401 } };
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(err);

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(localStorage.getItem('access_token')).toBeNull();
    });

    it('does not logout on transient errors (429, 5xx, network)', async () => {
      localStorage.setItem('access_token', 'token');
      useAuthStore.setState({ isAuthenticated: true, token: 'token' });
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

      await useAuthStore.getState().checkAuth();
      localStorage.setItem('access_token', 'token');
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockRejectedValue(new Error('network'));

      await useAuthStore.getState().checkAuth();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true); // optimistic state preserved
      expect(state.isLoading).toBe(false);
    });

    it('returns early when no token', async () => {
      await useAuthStore.getState().checkAuth();
      expect(authApi.getCurrentUser).not.toHaveBeenCalled();
    });
  });

  describe('demo mode', () => {
    it('enableDemo logs in demo user and sets demo_mode', async () => {
      const tokenResponse = { access_token: 'demo_access', refresh_token: 'demo_refresh' };
      const apiUser = { id: 99, email: DEMO_CREDENTIALS.email, full_name: 'Demo User', role: 'engineer', is_active: true };
      (authApi.login as ReturnType<typeof vi.fn>).mockResolvedValue(tokenResponse);
      (authApi.getCurrentUser as ReturnType<typeof vi.fn>).mockResolvedValue(apiUser);

      await useAuthStore.getState().enableDemo();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(true);
      expect(state.isDemoMode).toBe(true);
      expect(state.user?.email).toBe(DEMO_CREDENTIALS.email);
      expect(localStorage.getItem('demo_mode')).toBe('1');
    });

    it('disableDemo clears demo state', () => {
      useAuthStore.setState({ isDemoMode: true, isAuthenticated: true, token: 't', user: { id: 1, email: 'a', full_name: null, role: 'engineer' as const, is_active: true } });
      useAuthStore.getState().disableDemo();

      const state = useAuthStore.getState();
      expect(state.isAuthenticated).toBe(false);
      expect(state.isDemoMode).toBe(false);
      expect(localStorage.getItem('demo_mode')).toBeNull();
    });
  });
});
