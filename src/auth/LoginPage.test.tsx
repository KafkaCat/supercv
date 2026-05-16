import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from './LoginPage';

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signInWithOtp: vi.fn(),
    },
  },
}));

function renderPage() {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders email input and submit button', () => {
    renderPage();
    expect(screen.getByLabelText(/邮箱|email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /发送|send/i })).toBeInTheDocument();
  });

  it('submits magic link request and shows confirmation', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null, session: null },
      error: null,
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/邮箱|email/i), 'liguoso77@gmail.com');
    await user.click(screen.getByRole('button', { name: /发送|send/i }));

    await waitFor(() => {
      expect(supabase.auth.signInWithOtp).toHaveBeenCalledWith({
        email: 'liguoso77@gmail.com',
        options: expect.objectContaining({ shouldCreateUser: false }),
      });
    });

    expect(screen.getByText(/已发送|sent|check your email/i)).toBeInTheDocument();
  });

  it('shows user-not-found error when Supabase returns signups disabled error', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'Signups not allowed for otp', status: 400, name: 'AuthApiError' },
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/邮箱|email/i), 'stranger@example.com');
    await user.click(screen.getByRole('button', { name: /发送|send/i }));

    await waitFor(() => {
      expect(screen.getByText(/未授权|not authorized|邀请/i)).toBeInTheDocument();
    });
  });

  it('shows generic error for other Supabase errors', async () => {
    const { supabase } = await import('../lib/supabase');
    (supabase.auth.signInWithOtp as ReturnType<typeof vi.fn>).mockResolvedValue({
      data: { user: null, session: null },
      error: { message: 'rate limit exceeded', status: 429, name: 'AuthApiError' },
    });

    const user = userEvent.setup();
    renderPage();

    await user.type(screen.getByLabelText(/邮箱|email/i), 'foo@bar.com');
    await user.click(screen.getByRole('button', { name: /发送|send/i }));

    await waitFor(() => {
      expect(screen.getByText(/失败|error|出错/i)).toBeInTheDocument();
    });
  });
});
