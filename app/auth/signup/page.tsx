'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the new wallet-based registration
    router.push('/');
  }, [router]);

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-4">
      <div className="glass-card rounded-2xl p-8 shadow-2xl max-w-md mx-auto text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-primary mb-2">Registration Updated</h1>
          <p className="text-secondary">
            We've upgraded to wallet-based registration for better security and Web3 integration.
          </p>
        </div>

        <div className="space-y-4">
          <Link
            href="/"
            className="block w-full btn-primary text-white font-semibold py-3 rounded-xl transition-all duration-300"
          >
            Go to New Registration
          </Link>

          <Link
            href="/auth/signin"
            className="block text-blue-600 hover:text-blue-800 transition-colors"
          >
            Or sign in with existing account
          </Link>
        </div>
      </div>
    </div>
  );
}
