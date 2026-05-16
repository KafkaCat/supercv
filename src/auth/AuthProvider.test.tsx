import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import type { Session } from '@supabase/supabase-js';
import { AuthProvider, useAuth } from './AuthProvider';

// Mock supabase client before importing anything that uses it
vi.mock('../lib/supabase', () => {
  const listeners: Array<(event: string, session: Session | null) => void> = [];
  const mock = {
    supabase: {
      auth: {
        getSession: vi.fn(),
        onAuthStateChange: vi.fn((cb: (event: string, session: Session | null) => void) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
        signOut: vi.fn(),
      },
    },
    __emitAuthEvent: (event: string, session: Session | null) => {
      listeners.forEach((cb) => cb(event, session));
    },
  };
  return mock;
});

// Small consumer component to read auth state
function AuthConsumer() {
  const { user, session, isLoading } = useAuth();
  if (isLoading) return <div data-testid="loading">loading</div>;
  if (!user) return <div data-testid="no-user">no-user</div>;
  return (
    <div data-testid="user">
      {user.email}
      <span data-testid="session-exp">{session?.expires_at ?? 'none'}</span>
    </div>
  );
}

describe('AuthProvider', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
  });

  it('starts in loading state then shows no-user when no session', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading')).toBeInTheDocument();
    await waitFor(() => expect(screen.getByTestId('no-user')).toBeInTheDocument());
  });

  it('exposes the user when a valid session exists', async () => {
    const fakeSession = {
      access_token: 'tok',
      refresh_token: 'rtok',
      expires_at: 9999999999,
      token_type: 'bearer',
      user: { id: 'u1', email: 'liguoso77@gmail.com', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} },
    } as unknown as Session;

    const { supabase } = await import('../lib/supabase');
    (supabase.auth.getSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: fakeSession },
      error: null,
    });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('liguoso77@gmail.com'));
  });

  it('updates state when SIGNED_IN event fires', async () => {
    const { supabase, __emitAuthEvent } = (await import('../lib/supabase')) as unknown as {
      supabase: { auth: { getSession: ReturnType<typeof vi.fn> } };
      __emitAuthEvent: (event: string, session: Session | null) => void;
    };
    supabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('no-user')).toBeInTheDocument());

    const newSession = {
      access_token: 'new',
      refresh_token: 'r',
      expires_at: 1,
      token_type: 'bearer',
      user: { id: 'u1', email: 'liguoso77@gmail.com', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} },
    } as unknown as Session;

    act(() => {
      __emitAuthEvent('SIGNED_IN', newSession);
    });

    await waitFor(() => expect(screen.getByTestId('user')).toHaveTextContent('liguoso77@gmail.com'));
  });

  it('clears user when SIGNED_OUT event fires', async () => {
    const fakeSession = {
      access_token: 'tok',
      refresh_token: 'rtok',
      expires_at: 9999999999,
      token_type: 'bearer',
      user: { id: 'u1', email: 'liguoso77@gmail.com', aud: 'authenticated', created_at: '', app_metadata: {}, user_metadata: {} },
    } as unknown as Session;
    const { supabase, __emitAuthEvent } = (await import('../lib/supabase')) as unknown as {
      supabase: { auth: { getSession: ReturnType<typeof vi.fn> } };
      __emitAuthEvent: (event: string, session: Session | null) => void;
    };
    supabase.auth.getSession.mockResolvedValue({ data: { session: fakeSession }, error: null });

    render(
      <AuthProvider>
        <AuthConsumer />
      </AuthProvider>,
    );

    await waitFor(() => expect(screen.getByTestId('user')).toBeInTheDocument());

    act(() => {
      __emitAuthEvent('SIGNED_OUT', null);
    });

    await waitFor(() => expect(screen.getByTestId('no-user')).toBeInTheDocument());
  });
});
