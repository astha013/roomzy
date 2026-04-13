import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { MOCK_USER, MOCK_TOKEN } from './mocks/handlers';
import { AuthContext } from '../context/AuthContext';
import { ToastContext } from '../context/ToastContext';

// ── AuthContext mock ───────────────────────────────────────────────────────
export const mockAuthContextValue = (overrides = {}) => ({
  user:            MOCK_USER,
  token:           MOCK_TOKEN,
  loading:         false,
  isAuthenticated: true,
  trustScore:      MOCK_USER.trustScore,
  canChat:         MOCK_USER.trustScore >= 30,
  isAdmin:         false,
  login:           vi.fn().mockResolvedValue(MOCK_USER),
  logout:          vi.fn(),
  refreshUser:     vi.fn().mockResolvedValue(MOCK_USER),
  setUser:         vi.fn(),
  ...overrides,
});

export const mockToast = vi.fn();

// ── Render with full provider stack ───────────────────────────────────────

function TestWrapper({ children, authOverrides = {} }) {
  const authValue = mockAuthContextValue(authOverrides);
  return (
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <ToastContext.Provider value={{ toast: mockToast }}>
          {children}
        </ToastContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

export function renderWithProviders(ui, { authOverrides = {}, ...options } = {}) {
  return render(ui, {
    wrapper: ({ children }) => <TestWrapper authOverrides={authOverrides}>{children}</TestWrapper>,
    ...options,
  });
}

// ── Unauthenticated wrapper ────────────────────────────────────────────────
function UnauthWrapper({ children }) {
  const authValue = mockAuthContextValue({
    user: null, token: null, isAuthenticated: false, trustScore: 0, canChat: false,
  });
  return (
    <BrowserRouter>
      <AuthContext.Provider value={authValue}>
        <ToastContext.Provider value={{ toast: mockToast }}>
          {children}
        </ToastContext.Provider>
      </AuthContext.Provider>
    </BrowserRouter>
  );
}

export function renderUnauthenticated(ui) {
  return render(ui, { wrapper: UnauthWrapper });
}

// ── Setup localStorage mock ────────────────────────────────────────────────
export function setupLocalStorage(token = MOCK_TOKEN) {
  window.localStorage.getItem.mockImplementation((key) => {
    if (key === 'rz_token') return token;
    return null;
  });
}

export function clearLocalStorage() {
  window.localStorage.getItem.mockReturnValue(null);
}
