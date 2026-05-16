import { useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';

type Status = 'idle' | 'submitting' | 'sent' | 'error-not-authorized' | 'error-generic';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<Status>('idle');
  const [errorDetail, setErrorDetail] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setStatus('submitting');
    setErrorDetail('');

    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: false,
        emailRedirectTo: redirectTo,
      },
    });

    if (error) {
      const msg = error.message.toLowerCase();
      if (msg.includes('signup') && (msg.includes('not allowed') || msg.includes('disabled'))) {
        setStatus('error-not-authorized');
      } else if (msg.includes('user not found') || msg.includes('invalid login')) {
        setStatus('error-not-authorized');
      } else {
        setStatus('error-generic');
        setErrorDetail(error.message);
      }
      return;
    }

    setStatus('sent');
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold">WonderCV</h1>
          <p className="text-sm text-slate-400">
            仅限受邀用户。输入邮箱获取登录链接。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm text-slate-300">
              邮箱 / Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-slate-800 bg-slate-900 px-3 py-2 text-slate-100 placeholder:text-slate-600 focus:border-primary focus:outline-none"
              placeholder="you@example.com"
              disabled={status === 'submitting'}
            />
          </div>

          <button
            type="submit"
            disabled={!email || status === 'submitting'}
            className="w-full rounded-md bg-primary px-3 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {status === 'submitting' ? '发送中...' : '发送登录链接 / Send magic link'}
          </button>
        </form>

        {status === 'sent' && (
          <div className="rounded-md border border-emerald-800 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
            登录链接已发送，请检查邮箱。/ Magic link sent. Check your email.
          </div>
        )}

        {status === 'error-not-authorized' && (
          <div className="rounded-md border border-amber-800 bg-amber-950/40 px-3 py-2 text-sm text-amber-200">
            此邮箱未授权或邀请未生效。请联系管理员。/ This email is not authorized. Ask admin for an invite.
          </div>
        )}

        {status === 'error-generic' && (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            登录失败 / Login error: {errorDetail}
          </div>
        )}
      </div>
    </div>
  );
}
