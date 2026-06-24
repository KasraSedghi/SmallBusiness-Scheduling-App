'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from '@/utils/supabase/auth';
import { validatePassword } from '@/utils/validation';

const RATE_LIMIT_MS = 1000;
const MAX_ATTEMPTS_PER_MINUTE = 5;

type AuthMode = 'signin' | 'signup';

export default function LoginPage() {
  const router = useRouter();

  const [mode, setMode] = useState<AuthMode>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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
    [email, password, confirmPassword, lastAttempt, attemptCount, attemptResetTime, router]
  );

  const handleGoogleSignIn = useCallback(async () => {
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
    setLoading(true);

    try {
      const result = await signInWithGoogle();

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
  }, [lastAttempt, attemptCount, attemptResetTime]);

  const isSignUp = mode === 'signup';

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel - hidden on small screens */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-linear-to-br from-dark-crimson via-red-bean to-coffee-brown overflow-hidden">
        {/* Decorative blobs */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white-cream/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-light-cream/10 blur-3xl" />

        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div>
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-white-cream/90 flex items-center justify-center shadow-lg">
                <span className="text-3xl">🫘</span>
              </div>
              <span className="text-white-cream text-2xl font-bold">Red Bean Cafe</span>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-3 text-5xl">
              <span>☕</span>
              <span>🍨</span>
              <span>🫘</span>
            </div>
            <h2 className="text-white-cream text-4xl font-bold leading-tight">
              Brewing great
              <br />
              schedules,
              <br />
              one shift at a time.
            </h2>
            <p className="text-light-cream/90 text-lg max-w-sm">
              Submit your availability, request time off, and stay in sync with
              the team — all from your phone.
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex gap-2">
              <span className="h-1.5 w-8 rounded-full bg-white-cream" />
              <span className="h-1.5 w-8 rounded-full bg-white-cream/40" />
              <span className="h-1.5 w-8 rounded-full bg-white-cream/40" />
            </div>
            <p className="text-light-cream/70 text-sm">
              The Red Bean Annapolis &middot; Internal Scheduling Portal
            </p>
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-10 bg-white-cream">
        <div className="w-full max-w-md">
          {/* Mobile-only brand header */}
          <div className="lg:hidden flex items-center gap-3 justify-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-red-bean flex items-center justify-center shadow-md">
              <span className="text-2xl">🫘</span>
            </div>
            <span className="text-coffee-brown text-xl font-bold">Red Bean Scheduler</span>
          </div>

          <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-light-cream">
            <div className="px-6 sm:px-8 pt-8 pb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-coffee-brown text-center">
                {isSignUp ? 'Create your account' : 'Welcome back'}
              </h1>
              <p className="text-gray-500 text-center text-sm mt-2">
                {isSignUp
                  ? 'Sign up to start submitting your availability'
                  : 'Sign in to manage your shifts'}
              </p>
            </div>

            {/* Mode toggle */}
            <div className="flex border-b border-light-cream px-6 sm:px-8 gap-2">
              <button
                type="button"
                onClick={() => switchMode('signin')}
                className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  mode === 'signin'
                    ? 'border-red-bean text-red-bean'
                    : 'border-transparent text-gray-400 hover:text-coffee-brown'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => switchMode('signup')}
                className={`flex-1 py-3 font-semibold text-sm transition-colors border-b-2 ${
                  mode === 'signup'
                    ? 'border-red-bean text-red-bean'
                    : 'border-transparent text-gray-400 hover:text-coffee-brown'
                }`}
              >
                Sign Up
              </button>
            </div>

            <div className="px-6 sm:px-8 py-6">
              {error && (
                <div className="bg-red-50 border-l-4 border-red-bean px-4 py-3 mb-5 rounded">
                  <p className="text-red-bean text-sm font-medium">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-600 px-4 py-3 mb-5 rounded">
                  <p className="text-green-700 text-sm font-medium">{success}</p>
                </div>
              )}

              <form onSubmit={isSignUp ? handleEmailSignUp : handleEmailSignIn} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-coffee-brown mb-2">
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
                    className="w-full px-4 py-3 border-2 border-light-cream rounded-lg focus:outline-none focus:border-red-bean focus:ring-2 focus:ring-red-bean/20 text-coffee-brown placeholder-gray-400 transition"
                    disabled={loading}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label htmlFor="password" className="block text-sm font-semibold text-coffee-brown">
                      Password
                    </label>
                    <span className="text-xs text-gray-500">Min 8 characters</span>
                  </div>
                  <input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 transition text-coffee-brown placeholder-gray-400 ${
                      password && passwordError
                        ? 'border-red-200 focus:border-red-bean focus:ring-red-bean/20'
                        : 'border-light-cream focus:border-red-bean focus:ring-red-bean/20'
                    }`}
                    disabled={loading}
                  />
                  {passwordError && (
                    <p className="text-xs text-red-bean mt-2 font-medium">{passwordError}</p>
                  )}
                </div>

                {isSignUp && (
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-coffee-brown mb-2">
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
                      className="w-full px-4 py-3 border-2 border-light-cream rounded-lg focus:outline-none focus:border-red-bean focus:ring-2 focus:ring-red-bean/20 text-coffee-brown placeholder-gray-400 transition"
                      disabled={loading}
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || passwordError.length > 0 || !email || !password}
                  className="w-full bg-red-bean hover:bg-dark-crimson disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors duration-200 mt-2"
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

              <div className="flex items-center gap-3 my-6">
                <span className="flex-1 h-px bg-light-cream" />
                <span className="text-xs text-gray-400 font-medium">OR</span>
                <span className="flex-1 h-px bg-light-cream" />
              </div>

              <button
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 border-2 border-light-cream hover:border-red-bean/30 bg-white hover:bg-light-cream text-coffee-brown font-bold py-3 px-4 rounded-lg transition-colors duration-200"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
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

              <p className="text-xs text-center text-coffee-brown mt-6">
                {isSignUp ? (
                  <>
                    Already have an account?{' '}
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="text-red-bean hover:text-dark-crimson font-semibold"
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
                      className="text-red-bean hover:text-dark-crimson font-semibold"
                    >
                      Sign up here
                    </button>
                  </>
                )}
              </p>
            </div>

            <div className="bg-light-cream px-6 sm:px-8 py-4 text-center border-t border-white-cream">
              <p className="text-xs text-coffee-brown">
                Need help?{' '}
                <a href="#" className="text-red-bean hover:text-dark-crimson font-semibold">
                  Contact support
                </a>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-500 mt-6 px-4">
            By continuing, you agree to our Terms of Service
          </p>
        </div>
      </div>
    </div>
  );
}
