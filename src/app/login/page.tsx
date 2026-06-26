'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/utils/supabase/auth';
import { validatePassword } from '@/utils/validation';

const RATE_LIMIT_MS = 1000;
const MAX_ATTEMPTS_PER_MINUTE = 5;
const SIGNUP_ACCESS_CODE = 'RedBean2007';

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const [lastAttempt, setLastAttempt] = useState(0);
  const [attemptCount, setAttemptCount] = useState(0);
  const [attemptResetTime, setAttemptResetTime] = useState(Date.now());

  const validateEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const checkRateLimit = (): boolean => {
    const now = Date.now();

    if (now - attemptResetTime > 60000) {
      setAttemptCount(1);
      setAttemptResetTime(now);
      return true;
    }

    if (attemptCount >= MAX_ATTEMPTS_PER_MINUTE) {
      return false;
    }

    setAttemptCount((prev) => prev + 1);
    return true;
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);

    if (value.length > 0 && value.length < 8) {
      setPasswordError(`Password must be at least 8 characters (${value.length}/8)`);
    } else if (value.length === 0) {
      setPasswordError('');
    } else {
      const validation = validatePassword(value);
      if (!validation.isValid) {
        setPasswordError(validation.errors.join('; '));
      } else {
        setPasswordError('');
      }
    }
  };

  const switchMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
    setPassword('');
    setConfirmPassword('');
    setAccessCode('');
    setPasswordError('');
  };

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      const now = Date.now();
      if (now - lastAttempt < RATE_LIMIT_MS) {
        setError('Please wait before trying again');
        return;
      }

      if (!checkRateLimit()) {
        setError('Too many login attempts. Please try again in a minute.');
        return;
      }

      setLastAttempt(now);

      if (!email.trim()) {
        setError('Email is required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!password.trim()) {
        setError('Password is required');
        return;
      }

      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      setLoading(true);

      try {
        const result = await signInWithEmail(email, password);

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        if (result.data?.id) {
          router.push('/');
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    },
    [email, password, lastAttempt, attemptCount, attemptResetTime, router]
  );

  const handleEmailSignUp = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setSuccess('');

      const now = Date.now();
      if (now - lastAttempt < RATE_LIMIT_MS) {
        setError('Please wait before trying again');
        return;
      }

      if (!checkRateLimit()) {
        setError('Too many attempts. Please try again in a minute.');
        return;
      }

      setLastAttempt(now);

      if (!email.trim()) {
        setError('Email is required');
        return;
      }

      if (!validateEmail(email)) {
        setError('Please enter a valid email address');
        return;
      }

      if (!password.trim()) {
        setError('Password is required');
        return;
      }

      const validation = validatePassword(password);
      if (!validation.isValid) {
        setError(validation.errors.join('; '));
        return;
      }

      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }

      if (accessCode.trim() !== SIGNUP_ACCESS_CODE) {
        setError('Invalid access code. Ask your manager for the staff signup code.');
        return;
      }

      setLoading(true);

      try {
        const result = await signUpWithEmail(email, password);

        if (result.error) {
          setError(result.error);
          setLoading(false);
          return;
        }

        if (result.data?.id) {
          setSuccess('Account created! Redirecting to your schedule...');
          setTimeout(() => router.push('/'), 800);
        }
      } catch (err) {
        setError('An unexpected error occurred. Please try again.');
        setLoading(false);
      }
    },
    [email, password, confirmPassword, accessCode, lastAttempt, attemptCount, attemptResetTime, router]
  );

  const handleGoogleSignIn = useCallback(async () => {
    setError('');
    setSuccess('');

    if (mode === 'signup' && accessCode.trim() !== SIGNUP_ACCESS_CODE) {
      setError('Invalid access code. Ask your manager for the staff signup code.');
      return;
    }

    const now = Date.now();
    if (now - lastAttempt < RATE_LIMIT_MS) {
      setError('Please wait before trying again');
      return;
    }

    if (!checkRateLimit()) {
      setError('Too many login attempts. Please try again in a minute.');
      return;
    }

    setLastAttempt(now);
    setLoading(true);

    try {
      const result = await signInWithGoogle(mode === 'signup' ? accessCode.trim() : undefined);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.data?.url) {
        window.location.href = result.data.url;
      }
    } catch (err) {
      setError('Failed to initiate Google sign in. Please try again.');
      setLoading(false);
    }
  }, [mode, accessCode, lastAttempt, attemptCount, attemptResetTime]);

  const isSignUp = mode === 'signup';

  return (
    <div className="flex min-h-screen bg-surface">
      {/* ── Left brand panel (lg+) ───────────────────────────────── */}
      <aside className="relative hidden w-1/2 flex-col justify-between overflow-hidden bg-linear-to-br from-brand-deep via-brand to-brand-deep p-12 lg:flex">
        {/* Decorative concentric rings */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-96 w-96 rounded-full border border-cream-white/10" />
        <div className="pointer-events-none absolute -right-12 -top-12 h-96 w-96 rounded-full border border-cream-white/10" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle_at_center,rgba(245,230,211,0.10)_0%,transparent_70%)] blur-2xl" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cream-white/10 backdrop-blur-sm">
            <span className="text-2xl">🫘</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-cream-white">The Red Bean</span>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h1 className="text-4xl font-semibold leading-tight tracking-tight text-cream-white">
            Welcome to
            <br />
            The Red Bean.<span className="ml-2 inline-block">👋</span>
          </h1>
          <p className="mt-4 max-w-sm text-sm font-light leading-relaxed text-cream/90">
            Submit your weekly shift preferences, track your hours, and stay on top of
            deadlines — all in one place built for the Annapolis team.
          </p>
          <ul className="mt-8 space-y-3">
            {[
              'Pick your shifts in seconds',
              'Live hour & shift validation',
              'Never miss the Sunday deadline',
            ].map((line) => (
              <li key={line} className="flex items-center gap-3 text-sm text-cream/90">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cream-white/15 text-xs text-cream-white">
                  ✓
                </span>
                {line}
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative z-10 text-xs font-light tracking-wide text-cream/60">
          © {new Date().getFullYear()} The Red Bean Annapolis. All rights reserved.
        </p>
      </aside>

      {/* ── Right form panel ─────────────────────────────────────── */}
      <div className="flex w-full flex-col items-center justify-center px-4 py-10 sm:px-6 lg:w-1/2">
        {/* Mobile brand mark */}
        <div className="mb-8 flex flex-col items-center text-center lg:hidden">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-deep/5 shadow-sm">
            <span className="text-3xl">🫘</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">The Red Bean</h1>
          <p className="mt-1 text-sm font-light tracking-wide text-ink-muted">
            Internal Scheduling Portal
          </p>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-6">
            <h2 className="text-2xl font-semibold text-ink">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1.5 text-sm font-light tracking-wide text-ink-muted">
              {isSignUp
                ? 'Sign up to start submitting your availability'
                : 'Sign in to manage your shifts'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex gap-1 rounded-xl bg-surface-muted/80 p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'signin'
                  ? 'bg-border text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-border text-ink shadow-sm'
                  : 'text-ink-muted hover:text-ink-soft'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border border-brand/10 bg-brand-deep/5 px-4 py-3">
              <p className="text-sm font-medium text-brand">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border border-success/10 bg-success/5 px-4 py-3">
              <p className="text-sm font-medium text-success">{success}</p>
            </div>
          )}

          <form
            onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4"
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-ink-soft">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setError('');
                }}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-ink placeholder-ink-faint shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-1 focus:ring-brand/40"
                disabled={loading}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-ink-soft">
                  Password
                </label>
                <span className="text-xs text-ink-faint">Min 8 characters</span>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-ink placeholder-ink-faint shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-1 focus:ring-brand/40"
                disabled={loading}
              />
              {passwordError && (
                <p className="mt-2 text-xs font-medium text-brand">{passwordError}</p>
              )}
            </div>

            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-ink-soft"
                >
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  placeholder="Re-enter your password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-ink placeholder-ink-faint shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-1 focus:ring-brand/40"
                  disabled={loading}
                />
              </div>
            )}

            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label
                  htmlFor="accessCode"
                  className="mb-2 block text-sm font-medium text-ink-soft"
                >
                  Staff Access Code
                </label>
                <input
                  id="accessCode"
                  type="text"
                  placeholder="Provided by your manager"
                  value={accessCode}
                  onChange={(e) => {
                    setAccessCode(e.target.value);
                    setError('');
                  }}
                  className="w-full rounded-xl border border-border bg-surface-muted px-4 py-3 text-sm text-ink placeholder-ink-faint shadow-sm outline-none transition-all duration-200 focus:border-brand focus:ring-1 focus:ring-brand/40"
                  disabled={loading}
                />
                <p className="mt-1.5 text-xs text-ink-faint">
                  Required to confirm you're a Red Bean team member.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={
                loading ||
                passwordError.length > 0 ||
                !email ||
                !password ||
                (isSignUp && !accessCode)
              }
              className="mt-2 w-full transform rounded-xl bg-gradient-to-r from-brand-deep to-brand py-3 font-medium text-cream-white shadow-md shadow-brand-deep/10 transition-all duration-300 hover:-translate-y-0.5 hover:from-brand hover:to-rose-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {loading
                ? isSignUp
                  ? 'Creating account...'
                  : 'Signing in...'
                : isSignUp
                  ? 'Create Account'
                  : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-light tracking-wide text-ink-faint">OR</span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-medium text-ink-soft transition-all duration-200 hover:bg-border active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            {loading ? 'Please wait...' : `${isSignUp ? 'Sign up' : 'Sign in'} with Google`}
          </button>

          <p className="mt-6 text-center text-xs text-ink-muted">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-medium text-brand hover:text-brand-deep"
                >
                  Sign in
                </button>
              </>
            ) : (
              <>
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className="font-medium text-brand hover:text-brand-deep"
                >
                  Sign up here
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-xs text-ink-faint">
            Need help?{' '}
            <a href="#" className="font-medium text-brand hover:text-brand-deep">
              Contact support
            </a>
          </p>
        </div>

        <p className="mt-6 px-4 text-center text-xs font-light tracking-wide text-ink-faint">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
