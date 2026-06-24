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
          router.push('/availability');
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
          setTimeout(() => router.push('/availability'), 800);
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
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-stone-50 via-orange-50/20 to-stone-100 px-4 py-10">
      {/* Ambient glow */}
      <div className="pointer-events-none absolute left-1/2 top-0 h-[40rem] w-[40rem] -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle_at_center,rgba(139,0,0,0.06)_0%,transparent_70%)] blur-3xl" />

      <div className="relative z-10 w-full max-w-md">
        {/* Brand header */}
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-950/5 shadow-sm">
            <span className="text-3xl">🫘</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-stone-800">
            The Red Bean
          </h1>
          <p className="mt-1 text-sm font-light tracking-wide text-stone-500">
            Internal Scheduling Portal
          </p>
        </div>

        {/* Auth card */}
        <div className="rounded-2xl border border-stone-200/60 bg-white/70 p-8 shadow-[0_8px_32px_0_rgba(28,25,23,0.05)] backdrop-blur-md transition-all duration-300 ease-out">
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-stone-800">
              {isSignUp ? 'Create your account' : 'Welcome back'}
            </h2>
            <p className="mt-1.5 text-sm font-light tracking-wide text-stone-500">
              {isSignUp
                ? 'Sign up to start submitting your availability'
                : 'Sign in to manage your shifts'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="mb-6 flex gap-1 rounded-xl bg-stone-100/80 p-1">
            <button
              type="button"
              onClick={() => switchMode('signin')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'signin'
                  ? 'bg-white text-red-950 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => switchMode('signup')}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition-all duration-200 ${
                mode === 'signup'
                  ? 'bg-white text-red-950 shadow-sm'
                  : 'text-stone-500 hover:text-stone-700'
              }`}
            >
              Sign Up
            </button>
          </div>

          {error && (
            <div className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border border-red-900/10 bg-red-50/80 px-4 py-3">
              <p className="text-sm font-medium text-red-900">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-5 animate-in fade-in slide-in-from-bottom-2 duration-300 rounded-xl border border-green-700/10 bg-green-50/80 px-4 py-3">
              <p className="text-sm font-medium text-green-700">{success}</p>
            </div>
          )}

          <form
            onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn}
            className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4"
          >
            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-stone-700">
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
                className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition-all duration-200 focus:border-red-900 focus:ring-1 focus:ring-red-900/40"
                disabled={loading}
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-stone-700">
                  Password
                </label>
                <span className="text-xs text-stone-400">Min 8 characters</span>
              </div>
              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition-all duration-200 focus:border-red-900 focus:ring-1 focus:ring-red-900/40"
                disabled={loading}
              />
              {passwordError && (
                <p className="mt-2 text-xs font-medium text-red-900">{passwordError}</p>
              )}
            </div>

            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label
                  htmlFor="confirmPassword"
                  className="mb-2 block text-sm font-medium text-stone-700"
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
                  className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition-all duration-200 focus:border-red-900 focus:ring-1 focus:ring-red-900/40"
                  disabled={loading}
                />
              </div>
            )}

            {isSignUp && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <label
                  htmlFor="accessCode"
                  className="mb-2 block text-sm font-medium text-stone-700"
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
                  className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-800 placeholder-stone-400 shadow-sm outline-none transition-all duration-200 focus:border-red-900 focus:ring-1 focus:ring-red-900/40"
                  disabled={loading}
                />
                <p className="mt-1.5 text-xs text-stone-400">
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
              className="mt-2 w-full transform rounded-xl bg-gradient-to-r from-red-950 to-red-900 py-3 font-medium text-stone-100 shadow-md shadow-red-950/10 transition-all duration-300 hover:-translate-y-0.5 hover:from-red-900 hover:to-rose-900 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
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
            <span className="h-px flex-1 bg-stone-200" />
            <span className="text-xs font-light tracking-wide text-stone-400">OR</span>
            <span className="h-px flex-1 bg-stone-200" />
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 py-3 text-sm font-medium text-stone-700 transition-all duration-200 hover:bg-stone-50/80 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
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

          <p className="mt-6 text-center text-xs text-stone-500">
            {isSignUp ? (
              <>
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className="font-medium text-red-900 hover:text-red-950"
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
                  className="font-medium text-red-900 hover:text-red-950"
                >
                  Sign up here
                </button>
              </>
            )}
          </p>

          <p className="mt-4 text-center text-xs text-stone-400">
            Need help?{' '}
            <a href="#" className="font-medium text-red-900 hover:text-red-950">
              Contact support
            </a>
          </p>
        </div>

        <p className="mt-6 px-4 text-center text-xs font-light tracking-wide text-stone-400">
          By continuing, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
