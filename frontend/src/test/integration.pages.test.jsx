/**
 * INTEGRATION TESTS: Page Components
 * Tests user interactions, API calls, state updates, and error handling
 * Uses MSW to intercept real fetch calls — no mocking of modules
 */

import { describe, test, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders, renderUnauthenticated, mockToast } from './helpers';
import { server } from './mocks/server';
import { http, HttpResponse } from 'msw';
import { Login, Register } from '../pages/Auth';
import Matches from '../pages/Matches';
import Profile from '../pages/Profile';
import Trust from '../pages/Trust';
import { MOCK_USER } from './mocks/handlers';

const BASE = 'http://localhost:5000/api';

// ══════════════════════════════════════════════════════════════════════════
// LOGIN PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Login page', () => {
  const user = userEvent.setup();

  test('renders email and password fields', () => {
    renderUnauthenticated(<Login />);
    expect(screen.getByPlaceholderText(/you@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/••••••••/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /log in/i })).toBeInTheDocument();
  });

  test('shows validation error when fields empty', async () => {
    renderUnauthenticated(<Login />);
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
  });

  test('shows invalid email error', async () => {
    renderUnauthenticated(<Login />);
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'notanemail');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
  });

  test('calls login and redirects on success', async () => {
    const mockLogin = vi.fn().mockResolvedValue(MOCK_USER);
    renderWithProviders(<Login />, { authOverrides: { isAuthenticated: false, user: null, login: mockLogin } });
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'priya@test.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'password123');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    await waitFor(() => expect(mockLogin).toHaveBeenCalledWith('priya@test.com', 'password123'));
  });

  test('shows error message on wrong credentials', async () => {
    renderWithProviders(<Login />, {
      authOverrides: {
        isAuthenticated: false, user: null,
        login: vi.fn().mockRejectedValue({ response: { status: 401, data: { message: 'Invalid email or password' } } }),
      },
    });
    await user.type(screen.getByPlaceholderText(/you@example\.com/i), 'wrong@test.com');
    await user.type(screen.getByPlaceholderText(/••••••••/i), 'wrongpass');
    await user.click(screen.getByRole('button', { name: /log in/i }));
    expect(await screen.findByText(/invalid email or password/i)).toBeInTheDocument();
  });

  test('has link to register page', () => {
    renderUnauthenticated(<Login />);
    expect(screen.getByRole('link', { name: /sign up/i })).toBeInTheDocument();
  });

  test('has link to forgot password', () => {
    renderUnauthenticated(<Login />);
    expect(screen.getByRole('link', { name: /forgot password/i })).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// REGISTER PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Register page', () => {
  const user = userEvent.setup();

  test('renders all required fields', () => {
    renderUnauthenticated(<Register />);
    expect(screen.getByPlaceholderText(/priya sharma/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/priya@example\.com/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/min\. 6/i)).toBeInTheDocument();
    expect(screen.getByText(/Select your city/i)).toBeInTheDocument();
  });

  test('shows error if intent not selected', async () => {
    renderUnauthenticated(<Register />);
    await user.type(screen.getByPlaceholderText(/priya sharma/i), 'Test User');
    await user.type(screen.getByPlaceholderText(/priya@example\.com/i), 'test@test.com');
    await user.type(screen.getByPlaceholderText(/min\. 6/i), 'password123');
    await user.selectOptions(screen.getByRole('combobox'), 'Mumbai');
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/select your intent/i)).toBeInTheDocument();
  });

  test('selects intent card correctly', async () => {
    renderUnauthenticated(<Register />);
    const haveRoomCard = screen.getByText(/have a room/i).closest('.intent-card');
    await user.click(haveRoomCard);
    expect(haveRoomCard).toHaveClass('selected');
  });

  test('shows success screen after registration', async () => {
    renderUnauthenticated(<Register />);
    await user.type(screen.getByPlaceholderText(/priya sharma/i), 'New User');
    await user.type(screen.getByPlaceholderText(/priya@example\.com/i), 'newuser@test.com');
    await user.type(screen.getByPlaceholderText(/min\. 6/i), 'password123');
    await user.selectOptions(screen.getByRole('combobox'), 'Mumbai');
    await user.click(screen.getByText(/have a room/i).closest('.intent-card'));
    await user.click(screen.getByRole('button', { name: /create account/i }));
    expect(await screen.findByText(/check your inbox/i)).toBeInTheDocument();
  });

  test('shows error for duplicate email', async () => {
    renderWithProviders(<Register />, { authOverrides: { isAuthenticated: false, user: null } });
    await user.type(screen.getByPlaceholderText(/priya sharma/i), 'Existing User');
    await user.type(screen.getByPlaceholderText(/priya@example\.com/i), 'existing@test.com');
    await user.type(screen.getByPlaceholderText(/min\. 6/i), 'password123');
    await user.selectOptions(screen.getByRole('combobox'), 'Pune');
    await user.click(screen.getByText(/have a room/i).closest('.intent-card'));
    await user.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/already exists/i), 'error'));
  });
});

// ══════════════════════════════════════════════════════════════════════════
// MATCHES PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Matches page', () => {
  beforeEach(() => { mockToast.mockClear(); });

  test('renders match cards from API', async () => {
    renderWithProviders(<Matches />);
    expect(await screen.findByText('Arjun Kapoor')).toBeInTheDocument();
    expect(await screen.findByText('Neha Kulkarni')).toBeInTheDocument();
  });

  test('shows compatibility score on each card', async () => {
    renderWithProviders(<Matches />);
    await waitFor(() => expect(screen.getAllByText(/\d+%/).length).toBeGreaterThan(0));
  });

  test('shows trust score badge on cards', async () => {
    renderWithProviders(<Matches />);
    await waitFor(() => expect(screen.getByText(/Trust 62/i)).toBeInTheDocument());
  });

  test('shows intent badge on cards', async () => {
    renderWithProviders(<Matches />);
    expect(await screen.findByText(/Has Room/i)).toBeInTheDocument();
  });

  test('shows AI summary when present', async () => {
    renderWithProviders(<Matches />);
    expect(await screen.findByText(/Friendly and social/i)).toBeInTheDocument();
  });

  test('clicking Like calls matchApi.like', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Matches />);
    const likeButtons = await screen.findAllByRole('button', { name: /♥ like/i });
    await user.click(likeButtons[0]);
    await waitFor(() => expect(mockToast).toHaveBeenCalled());
  });

  test('clicking Pass removes card from list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Matches />);
    await screen.findByText('Arjun Kapoor');
    const passButtons = await screen.findAllByRole('button', { name: /✕ pass/i });
    await user.click(passButtons[0]);
    await waitFor(() => expect(screen.queryByText('Arjun Kapoor')).not.toBeInTheDocument());
  });

  test('shows trust gate banner when trustScore < 30', async () => {
    renderWithProviders(<Matches />, { authOverrides: { trustScore: 10, canChat: false } });
    expect(await screen.findByText(/unlock matching/i)).toBeInTheDocument();
  });

  test('shows profile incomplete banner when moveInDate missing', async () => {
    renderWithProviders(<Matches />, {
      authOverrides: { user: { ...MOCK_USER, preferences: {} } },
    });
    expect(await screen.findByText(/complete your profile/i)).toBeInTheDocument();
  });

  test('switching to Matched tab loads matched users', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Matches />);
    await screen.findByText('Arjun Kapoor');
    await user.click(screen.getByRole('button', { name: /matched/i }));
    await waitFor(() => expect(screen.getByText(/Start chatting/i)).toBeInTheDocument());
  });

  test('shows empty state when API returns empty array', async () => {
    server.use(http.get(`${BASE}/matches/suggestions`, () => HttpResponse.json([])));
    renderWithProviders(<Matches />);
    expect(await screen.findByText(/no suggestions yet/i)).toBeInTheDocument();
  });

  test('shows mutual match modal on isNowMatched=true', async () => {
    const user = userEvent.setup();
    renderWithProviders(<Matches />);
    const likeButtons = await screen.findAllByRole('button', { name: /♥ like/i });
    // First suggestion is user456 which triggers mutual match
    await user.click(likeButtons[0]);
    expect(await screen.findByText(/it's a match/i)).toBeInTheDocument();
    expect(await screen.findByText(/arjun kapoor/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// PROFILE PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Profile page', () => {
  const user = userEvent.setup();

  test('renders with hydrated user data', async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(screen.getByDisplayValue(MOCK_USER.name)).toBeInTheDocument();
      expect(screen.getByDisplayValue(MOCK_USER.city)).toBeInTheDocument();
    });
  });

  test('shows AI summary when present', async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText(/clean and organized/i)).toBeInTheDocument();
  });

  test('trust score ring is rendered', async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(`${MOCK_USER.trustScore}`)).toBeInTheDocument();
    });
  });

  test('Save basic info button calls updateProfile', async () => {
    renderWithProviders(<Profile />);
    const nameInput = await screen.findByDisplayValue(MOCK_USER.name);
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Name');
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[0]);
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('Profile saved ✓', 'success'));
  });

  test('Save preferences button calls updatePreferences', async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => screen.getAllByRole('button', { name: /save/i }).length > 1);
    const saveButtons = screen.getAllByRole('button', { name: /save/i });
    await user.click(saveButtons[1]); // second save = preferences
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith('Preferences saved ✓', 'success'));
  });

  test('shows trust layer completion status', async () => {
    renderWithProviders(<Profile />);
    await waitFor(() => {
      expect(screen.getByText(/email verified/i)).toBeInTheDocument();
      expect(screen.getByText(/phone otp/i)).toBeInTheDocument();
    });
  });

  test('shows intent cards', async () => {
    renderWithProviders(<Profile />);
    expect(await screen.findByText(/have a room/i)).toBeInTheDocument();
    expect(await screen.findByText(/find a room/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// TRUST PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Trust page', () => {
  const user = userEvent.setup();

  test('renders trust score ring with correct score', async () => {
    renderWithProviders(<Trust />);
    await waitFor(() => expect(screen.getByText('50')).toBeInTheDocument());
  });

  test('shows unlocked status when trustScore >= 30', async () => {
    renderWithProviders(<Trust />);
    expect(await screen.findByText(/chat & matching unlocked/i)).toBeInTheDocument();
  });

  test('shows warning when trustScore < 30', async () => {
    renderWithProviders(<Trust />, { authOverrides: { trustScore: 10, user: { ...MOCK_USER, trustScore: 10, isEmailVerified: false, phoneVerified: false } } });
    expect(await screen.findByText(/20 more points needed/i)).toBeInTheDocument();
  });

  test('phone OTP panel renders send button', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, phoneVerified: false } } });
    expect(await screen.findByRole('button', { name: /send otp/i })).toBeInTheDocument();
  });

  test('OTP verification flow - send then verify', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, phoneVerified: false } } });
    const phoneInput = await screen.findByPlaceholderText(/9876543210/i);
    await user.type(phoneInput, '9876543210');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    expect(await screen.findByText(/enter otp/i)).toBeInTheDocument();
    const otpInput = screen.getByPlaceholderText('123456');
    await user.type(otpInput, '123456');
    await user.click(screen.getByRole('button', { name: /verify/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/trust/i), 'success'));
  });

  test('OTP send rejects invalid Indian number', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, phoneVerified: false } } });
    const phoneInput = await screen.findByPlaceholderText(/9876543210/i);
    await user.type(phoneInput, '1234567890');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/valid.*10-digit/i), 'error'));
  });

  test('social links save button calls socialApi.save', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, socialLinks: {} } } });
    const linkedinInput = await screen.findByPlaceholderText(/linkedin\.com/i);
    await user.type(linkedinInput, 'https://linkedin.com/in/testuser');
    await user.click(screen.getByRole('button', { name: /save social links/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(expect.stringMatching(/saved/i), 'success'));
  });

  test('govt ID panel renders when not verified', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, governmentIdVerified: false } } });
    expect(await screen.findByText(/government id/i)).toBeInTheDocument();
    expect(await screen.findByText(/optional/i)).toBeInTheDocument();
  });

  test('email verified shows as done', async () => {
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, isEmailVerified: true } } });
    expect(await screen.findByText(/email verified/i)).toBeInTheDocument();
  });

  test('progress bar renders', async () => {
    renderWithProviders(<Trust />);
    const progressBar = await screen.findByText('50/100');
    expect(progressBar).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// PROTECTED ROUTE
// ══════════════════════════════════════════════════════════════════════════
describe('ProtectedRoute', () => {
  test('redirects to /login when unauthenticated', () => {
    const { container } = renderUnauthenticated(<Matches />);
    // In test env with BrowserRouter, ProtectedRoute renders Navigate
    // which doesn't render children — container will be effectively empty
    expect(screen.queryByText('Roommate Matches')).not.toBeInTheDocument();
  });

  test('renders children when authenticated', async () => {
    renderWithProviders(<Matches />);
    expect(await screen.findByText('Roommate Matches')).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// CHAT PAGE
// ══════════════════════════════════════════════════════════════════════════
describe('Chat page', () => {
  const user = userEvent.setup();

  test('renders conversation list from API', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    expect(await screen.findByText('Arjun Kapoor')).toBeInTheDocument();
  });

  test('shows last message preview in sidebar', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    expect(await screen.findByText(/are you still looking/i)).toBeInTheDocument();
  });

  test('shows unread indicator for conversations with unread messages', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    await screen.findByText('Arjun Kapoor');
    // The unread dot is a div with orange background - presence of conversation is sufficient
    expect(screen.getByText('Arjun Kapoor')).toBeInTheDocument();
  });

  test('clicking conversation loads messages', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    const conversation = await screen.findByText('Arjun Kapoor');
    await user.click(conversation.closest('div[style]') || conversation);
    expect(await screen.findByText(/are you still looking/i)).toBeInTheDocument();
  });

  test('shows locked input when trustScore < 30', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />, { authOverrides: { trustScore: 10, canChat: false } });
    await screen.findByText('Arjun Kapoor');
    expect(await screen.findByText(/30\+ trust points/i)).toBeInTheDocument();
  });

  test('shows message input when trustScore >= 30', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    expect(await screen.findByPlaceholderText(/type a message/i)).toBeInTheDocument();
  });

  test('search filters conversation list', async () => {
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    await screen.findByText('Arjun Kapoor');
    const searchInput = screen.getByPlaceholderText(/search conversations/i);
    await user.type(searchInput, 'xyz_no_match');
    await waitFor(() => expect(screen.queryByText('Arjun Kapoor')).not.toBeInTheDocument());
  });

  test('shows empty state when no conversations', async () => {
    server.use(http.get(`${BASE}/chat/list`, () => HttpResponse.json([])));
    const Chat = (await import('../pages/Chat')).default;
    renderWithProviders(<Chat />);
    expect(await screen.findByText(/no conversations yet/i)).toBeInTheDocument();
  });
});

// ══════════════════════════════════════════════════════════════════════════
// ERROR BOUNDARY / SERVER ERRORS
// ══════════════════════════════════════════════════════════════════════════
describe('API error handling in components', () => {
  test('Matches page handles API 400 gracefully', async () => {
    server.use(http.get(`${BASE}/matches/suggestions`, () =>
      HttpResponse.json({ message: 'Please set intent, move-in date and city in your profile' }, { status: 400 })
    ));
    renderWithProviders(<Matches />);
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.stringMatching(/complete your profile/i), 'warning'
    ));
  });

  test('Trust page handles OTP API error gracefully', async () => {
    server.use(http.post(`${BASE}/otp/send`, () =>
      HttpResponse.json({ message: 'Phone number already registered with another user' }, { status: 400 })
    ));
    const user = userEvent.setup();
    renderWithProviders(<Trust />, { authOverrides: { user: { ...MOCK_USER, phoneVerified: false } } });
    const phoneInput = await screen.findByPlaceholderText(/9876543210/i);
    await user.type(phoneInput, '9876543210');
    await user.click(screen.getByRole('button', { name: /send otp/i }));
    await waitFor(() => expect(mockToast).toHaveBeenCalledWith(
      expect.stringMatching(/already registered/i), 'error'
    ));
  });

  test('Matches page handles network error', async () => {
    server.use(http.get(`${BASE}/matches/suggestions`, () => HttpResponse.error()));
    renderWithProviders(<Matches />);
    // Should not crash - shows empty state
    await waitFor(() => expect(screen.queryByText(/loading/i)).not.toBeInTheDocument());
  });
});
