import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

vi.mock('@/features/auth/store/authStore', () => ({
  useAuthStore: vi.fn((selector) => {
    const state = (useAuthStore as any)._mockState || {
      user: null,
      isAuthenticated: false,
      isLoading: false,
      checkAuth: vi.fn(),
    };
    return selector(state);
  }),
}));

import { useAuthStore } from '@/features/auth/store/authStore';

function setMockState(state: Partial<ReturnType<typeof useAuthStore.getState>>) {
  (useAuthStore as any)._mockState = {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    checkAuth: vi.fn(),
    ...state,
  };
}

function renderProtectedRoute(props?: { allowedRoles?: string[] }) {
  return render(
    <MemoryRouter initialEntries={['/protected']}>
      <Routes>
        <Route path="/login" element={<div data-testid="login">Login</div>} />
        <Route path="/dashboard" element={<div data-testid="dashboard">Dashboard</div>} />
        <Route element={<ProtectedRoute {...props} />}>
          <Route path="/protected" element={<div data-testid="protected">Protected Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
    setMockState({});
    vi.clearAllMocks();
  });

  it('shows loading spinner while checking auth', () => {
    localStorage.setItem('access_token', 'token');
    setMockState({ isLoading: true, user: null, isAuthenticated: false });
    renderProtectedRoute();
    expect(screen.getByText('Загрузка…')).toBeInTheDocument();
  });

  it('redirects to login when no token', async () => {
    setMockState({ isLoading: false, user: null, isAuthenticated: false });
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  it('redirects to login when token exists but user not loaded', async () => {
    localStorage.setItem('access_token', 'token');
    setMockState({ isLoading: false, user: null, isAuthenticated: false });
    renderProtectedRoute();
    await waitFor(() => {
      expect(screen.getByTestId('login')).toBeInTheDocument();
    });
  });

  it('renders Outlet when authenticated', () => {
    localStorage.setItem('access_token', 'token');
    setMockState({
      isLoading: false,
      user: { id: 1, email: 'test@test.com', full_name: 'Test', role: 'engineer', is_active: true },
      isAuthenticated: true,
    });
    renderProtectedRoute();
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });

  it('redirects to dashboard when role is not allowed', async () => {
    localStorage.setItem('access_token', 'token');
    setMockState({
      isLoading: false,
      user: { id: 1, email: 'test@test.com', full_name: 'Test', role: 'engineer', is_active: true },
      isAuthenticated: true,
    });
    renderProtectedRoute({ allowedRoles: ['admin'] });
    await waitFor(() => {
      expect(screen.getByTestId('dashboard')).toBeInTheDocument();
    });
  });

  it('allows admin to bypass role check', () => {
    localStorage.setItem('access_token', 'token');
    setMockState({
      isLoading: false,
      user: { id: 1, email: 'admin@test.com', full_name: 'Admin', role: 'admin', is_active: true },
      isAuthenticated: true,
    });
    renderProtectedRoute({ allowedRoles: ['director'] });
    expect(screen.getByTestId('protected')).toBeInTheDocument();
  });
});
