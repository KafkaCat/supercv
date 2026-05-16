import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Status = 'working' | 'error-invalid-link' | 'error-exchange';

export function AuthCallback() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('working');
  const [detail, setDetail] = useState('');

  useEffect(() => {
    let cancelled = false;

    // PKCE flow: ?code=abc123
    const code = params.get('code');
    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ error }) => {
        if (cancelled) return;
        if (error) {
          setStatus('error-exchange');
          setDetail(error.message);
          return;
        }
        navigate('/', { replace: true });
      });
      return () => {
        cancelled = true;
      };
    }

    // Implicit flow: #access_token=...&refresh_token=... in hash fragment.
    // supabase-js auto-detects via detectSessionInUrl and fires SIGNED_IN.
    const hashHasToken =
      typeof window !== 'undefined' && window.location.hash.includes('access_token');
    if (!hashHasToken) {
      setStatus('error-invalid-link');
      return;
    }

    // Subscribe to auth events; redirect on SIGNED_IN.
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        navigate('/', { replace: true });
      }
    });

    // Fallback: in case detectSessionInUrl already fired before we subscribed,
    // poll getSession once after a short delay.
    const fallback = setTimeout(async () => {
      if (cancelled) return;
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session) {
        navigate('/', { replace: true });
      } else {
        setStatus('error-exchange');
        setDetail('Session was not established from the magic link.');
      }
    }, 2500);

    return () => {
      cancelled = true;
      data.subscription.unsubscribe();
      clearTimeout(fallback);
    };
  }, [params, navigate]);

  if (status === 'working') {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-slate-400">登录中... / Signing you in...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center px-6">
      <div className="w-full max-w-sm space-y-4">
        {status === 'error-invalid-link' && (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            登录链接无效或缺少参数 / Invalid or missing login link.
          </div>
        )}
        {status === 'error-exchange' && (
          <div className="rounded-md border border-red-800 bg-red-950/40 px-3 py-2 text-sm text-red-200">
            登录失败，链接已过期或被使用过 / Login failed. Link may be expired or already used. ({detail})
          </div>
        )}
        <Link
          to="/login"
          className="block w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-center text-sm text-slate-200 hover:border-slate-500"
        >
          返回重新登录 / Back to login
        </Link>
      </div>
    </div>
  );
}
