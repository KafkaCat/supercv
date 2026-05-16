import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AuthCallback } from './AuthCallback';

vi.mock('../lib/supabase', () => {
  const listeners: Array<(event: string, session: unknown) => void> = [];
  return {
    supabase: {
      auth: {
        exchangeCodeForSession: vi.fn(),
        getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
        onAuthStateChange: vi.fn((cb: (event: string, session: unknown) => void) => {
          listeners.push(cb);
          return { data: { subscription: { unsubscribe: vi.fn() } } };
        }),
      },
    },
    __emitAuthEvent: (event: string, session: unknown) => {
      listeners.forEach((cb) => cb(event, session));
    },
  };
});

function renderAtUrl(url: string) {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/login" element={<div data-testid="login-page">login</div>} />
        <Route path="/" element={<div data-testid="editor-home">editor</div>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('AuthCallback', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('exchanges code and redirects home on success', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.exchangeCodeForSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: { user: { id: 'u1' } } },
      error: null,
    });

    renderAtUrl('/auth/callback?code=abc123');

    await waitFor(() => {
      expect(supabase.auth.exchangeCodeForSession).toHaveBeenCalledWith('abc123');
    });
    await waitFor(() => expect(screen.getByTestId('editor-home')).toBeInTheDocument());
  });

  it('shows error message when exchange fails', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.exchangeCodeForSession as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { session: null },
      error: { message: 'invalid grant', status: 400, name: 'AuthApiError' },
    });

    renderAtUrl('/auth/callback?code=bad');

    await waitFor(() => {
      expect(screen.getByText(/登录失败|链接已过期|invalid|error/i)).toBeInTheDocument();
    });
    expect(screen.getByRole('link', { name: /重新登录|back to login/i })).toBeInTheDocument();
  });

  it('shows error when code is missing AND no hash token', async () => {
    renderAtUrl('/auth/callback');

    await waitFor(() => {
      expect(screen.getByText(/链接无效|invalid|missing/i)).toBeInTheDocument();
    });
  });

  it('implicit flow: handles hash fragment with access_token via SIGNED_IN event', async () => {
    // Simulate hash fragment by stubbing window.location.hash
    const originalHash = window.location.hash;
    Object.defineProperty(window.location, 'hash', {
      configurable: true,
      writable: true,
      value: '#access_token=abc&refresh_token=xyz&expires_in=3600&token_type=bearer&type=magiclink',
    });

    renderAtUrl('/auth/callback');

    const mod = (await import('../lib/supabase')) as unknown as {
      __emitAuthEvent: (event: string, session: unknown) => void;
    };
    // Wait a tick, then emit SIGNED_IN
    await waitFor(() => {
      expect(screen.getByText(/登录中/i)).toBeInTheDocument();
    });

    mod.__emitAuthEvent('SIGNED_IN', { user: { id: 'u1' }, access_token: 'abc' });

    await waitFor(() => expect(screen.getByTestId('editor-home')).toBeInTheDocument());

    // restore
    Object.defineProperty(window.location, 'hash', {
      configurable: true,
      writable: true,
      value: originalHash,
    });
  });
});
