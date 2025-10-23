'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/useAuth';
import { logoutDoctor } from '@/lib/firebase/auth';

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  const handleLogout = async () => {
    await logoutDoctor();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">Healthcare Platform</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-gray-600 hover:text-gray-900 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Doctor Dashboard</h2>
          <p className="text-gray-600">Welcome back, {user.email}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Total Tasks</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Appointments</h3>
            <p className="text-3xl font-bold text-green-600">0</p>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pending Payments</h3>
            <p className="text-3xl font-bold text-orange-600">0 PYUSD</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/tasks/create"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center"
          >
            <div className="text-4xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Create New Task</h3>
            <p className="text-gray-600">Set up consultation, procedure, or follow-up tasks</p>
          </Link>

          <Link
            href="/dashboard/tasks"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center"
          >
            <div className="text-4xl mb-4">📝</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Manage Tasks</h3>
            <p className="text-gray-600">View and edit your existing tasks</p>
          </Link>

          <Link
            href="/dashboard/appointments"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center"
          >
            <div className="text-4xl mb-4">📅</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Appointments</h3>
            <p className="text-gray-600">View scheduled appointments</p>
          </Link>

          <Link
            href="/dashboard/payments"
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-8 text-center"
          >
            <div className="text-4xl mb-4">💰</div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Payments</h3>
            <p className="text-gray-600">Manage PYUSD payments and approvals</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
