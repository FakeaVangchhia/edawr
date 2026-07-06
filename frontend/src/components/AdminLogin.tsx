'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, LockKeyhole, Mail, Store } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { AdminSession } from '../types';

type AdminLoginProps = {
  onBackToStore: () => void;
  onLogin: (session: AdminSession) => void;
  initialError?: string | null;
};

export default function AdminLogin({ onBackToStore, onLogin, initialError }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(initialError || '');

  const supabase = createClient();

  const helperText = useMemo(
    () => 'Sign in using your Google account or email credentials.',
    []
  );

  // Sync initialError from props to state
  useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  const handleGoogleLogin = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (oauthError) {
        throw oauthError;
      }
      // Note: The browser will redirect to Google's authentication page.
      // We don't reset isSubmitting because the page is about to unload.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in with Google.');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail || !normalizedPassword) {
      setError('Enter email and password.');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (signInError) {
        throw signInError;
      }

      if (!data.session) {
        throw new Error('Could not establish an active session.');
      }

      onLogin({
        username: data.user.email || normalizedEmail,
        accessToken: data.session.access_token,
      });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Unable to sign in.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-6 lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className="panel rounded-[2.25rem] p-8 sm:p-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-900/15">
            <Store className="h-6 w-6" />
          </div>
          <div className="section-label mt-8">Admin Access</div>
          <h1 className="mt-2 max-w-xl text-4xl font-black tracking-tight text-slate-950">
            Sign in to open the dashboard.
          </h1>
          <p className="mt-3 max-w-xl text-base leading-7 text-slate-600">
            Frontend admin access is now managed securely using Supabase Authentication.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-sm text-slate-500">Access</div>
              <div className="mt-1 text-xl font-black text-slate-950">Admin</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-sm text-slate-500">Provider</div>
              <div className="mt-1 text-xl font-black text-slate-950">Supabase</div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-5 py-4">
              <div className="text-sm text-slate-500">Security</div>
              <div className="mt-1 text-xl font-black text-slate-950">SSL/JWT</div>
            </div>
          </div>
        </section>

        <section className="panel rounded-[2.25rem] p-6 sm:p-8">
          <div className="space-y-5">
            <div>
              <h2 className="text-2xl font-black tracking-tight text-slate-950">Login</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500">{helperText}</p>
            </div>

            {/* Google OAuth Login Action */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={isSubmitting}
              className="relative flex w-full items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 shadow-sm transition-all duration-200 hover:bg-slate-50 hover:border-slate-300 hover:shadow-md hover:text-slate-950 active:bg-slate-100 disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer focus:outline-none focus:ring-2 focus:ring-slate-500/20"
            >
              <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
                <path d="M21.35,11.1H12v2.7h5.38c-0.24,1.28 -0.96,2.37 -2.04,3.1v2.58h3.3c1.93,-1.78 3.04,-4.4 3.04,-7.4C21.68,11.72 21.56,11.38 21.35,11.1z" fill="#4285F4" />
                <path d="M12,20.6c2.43,0 4.47,-0.8 5.96,-2.2l-3.3,-2.58c-0.92,0.62 -2.1,0.98 -3.3,0.98 -2.33,0 -4.3,-1.57 -5,-3.68H2.92v2.66C4.41,18.73 7.97,20.6 12,20.6z" fill="#34A853" />
                <path d="M7,13.12c-0.18,-0.54 -0.28,-1.11 -0.28,-1.7 0,-0.59 0.1,-1.16 0.28,-1.7V7.06H2.92c-0.6,1.2 -0.94,2.56 -0.94,4.02s0.34,2.82 0.94,4.02L7,13.12z" fill="#FBBC05" />
                <path d="M12,6.72c1.32,0 2.5,0.45 3.44,1.35l2.58,-2.58C16.46,4.08 14.42,3.4 12,3.4c-4.03,0 -7.59,1.87 -9.08,4.82l4.08,3.12C7.7,9.23 9.67,6.72 12,6.72z" fill="#EA4335" />
              </svg>
              <span>{isSubmitting ? 'Connecting...' : 'Sign in with Google'}</span>
            </button>

            {/* Divider */}
            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-slate-200/80"></div>
              <span className="mx-4 flex-shrink text-[10px] font-bold uppercase tracking-wider text-slate-400">or continue with email</span>
              <div className="flex-grow border-t border-slate-200/80"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Email Address</span>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    placeholder="admin@example.com"
                    className="field-control py-3 pl-10 pr-4"
                    autoComplete="email"
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm font-medium text-slate-700">Password</span>
                <div className="relative">
                  <LockKeyhole className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={event => setPassword(event.target.value)}
                    placeholder="Enter your password"
                    className="field-control py-3 pl-10 pr-4"
                    autoComplete="current-password"
                  />
                </div>
              </label>

              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="primary-action inline-flex w-full items-center justify-center rounded-2xl px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </button>

              <button
                type="button"
                onClick={onBackToStore}
                className="secondary-action inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Store
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
