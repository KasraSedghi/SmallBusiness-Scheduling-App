'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmail, signInWithGoogle } from '@/utils/supabase/auth';
import { validatePassword } from '@/utils/validation';

const RATE_LIMIT_MS = 1000;
const MAX_ATTEMPTS_PER_MINUTE = 5;

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [activeTab, setActiveTab] = useState<'email' | 'google'>('email');

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

  const handleEmailSignIn = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');

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

  const handleGoogleSignIn = useCallback(async () => {
    setError('');

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

  return (
    <div className="flex items-center justify-center min-h-screen px-4 py-8">
      <div className="w-full max-w-md">
        <div className="bg-white-cream rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="bg-linear-to-r from-red-bean to-dark-crimson px-6 py-8">
            <h1 className="text-3xl font-bold text-white text-center mb-2">
              Red Bean Scheduler
            </h1>
            <p className="text-light-cream text-center text-sm">
              Sign in to manage your shifts
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-bean px-6 py-4 mx-6 mt-6 rounded">
              <p className="text-red-bean text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Tab Navigation */}
          <div className="flex border-b border-light-cream">
            <button
              onClick={() => setActiveTab('email')}
              className={`flex-1 py-4 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'email'
                  ? 'border-b-2 border-red-bean text-red-bean bg-white'
                  : 'text-coffee-brown bg-light-cream hover:bg-white-cream'
              }`}
            >
              Email/Password
            </button>
            <button
              onClick={() => setActiveTab('google')}
              className={`flex-1 py-4 px-4 font-semibold text-sm transition-colors ${
                activeTab === 'google'
                  ? 'border-b-2 border-red-bean text-red-bean bg-white'
                  : 'text-coffee-brown bg-light-cream hover:bg-white-cream'
              }`}
            >
              Google
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Email/Password Tab */}
            {activeTab === 'email' && (
              <form onSubmit={handleEmailSignIn} className="space-y-4">
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

                <button
                  type="submit"
                  disabled={loading || passwordError.length > 0 || !email || !password}
                  className="w-full bg-red-bean hover:bg-dark-crimson disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg transition-colors duration-200 mt-6"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </button>

                <p className="text-xs text-center text-coffee-brown mt-4">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => router.push('/availability')}
                    className="text-red-bean hover:text-dark-crimson font-semibold"
                  >
                    Sign up here
                  </button>
                </p>
              </form>
            )}

            {/* Google Tab */}
            {activeTab === 'google' && (
              <div className="space-y-4">
                <p className="text-sm text-coffee-brown text-center">
                  Sign in with your Google account to get started quickly.
                </p>

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
                  {loading ? 'Signing in...' : 'Sign in with Google'}
                </button>

                <p className="text-xs text-center text-gray-500 mt-4">
                  We'll use your Google email to find or create your account.
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-light-cream px-6 py-4 text-center border-t border-white-cream">
            <p className="text-xs text-coffee-brown">
              Need help?{' '}
              <a href="#" className="text-red-bean hover:text-dark-crimson font-semibold">
                Contact support
              </a>
            </p>
          </div>
        </div>

        {/* Mobile-friendly spacing */}
        <p className="text-center text-xs text-gray-500 mt-6 px-4">
          By signing in, you agree to our Terms of Service
        </p>
      </div>
    </div>
  );
}
