'use client';

export default function LoginPage() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-full max-w-md p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-3xl font-bold text-red-bean mb-6 text-center">
          Login
        </h1>
        <p className="text-gray-600 text-center mb-6">
          Sign in with email/password or Google OAuth
        </p>

        {/* Placeholder for login form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-bean"
          />
          <input
            type="password"
            placeholder="Password (8+ characters)"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-bean"
          />
          <button className="w-full bg-red-bean text-white py-2 rounded-lg hover:bg-dark-crimson transition">
            Sign In
          </button>
        </div>
      </div>
    </div>
  );
}
