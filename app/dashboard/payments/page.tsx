'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';

export default function PaymentsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/dashboard" className="text-blue-600 hover:text-blue-700">
            ← Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Payments</h1>

        <div className="bg-white rounded-lg shadow p-8 text-center">
          <div className="text-6xl mb-4">💰</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No payments yet</h3>
          <p className="text-gray-600">PYUSD payments will appear here once appointments are completed</p>
        </div>
      </div>
    </div>
  );
}
