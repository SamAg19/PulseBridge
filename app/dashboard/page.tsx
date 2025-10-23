'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  const handleLogout = () => {
    disconnect();
    router.push('/');
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-blue">
      <nav className="glass-card border-b border-blue-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">Healthcare Platform</h1>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-4xl font-bold text-primary mb-2">Doctor Dashboard</h2>
          <p className="text-secondary text-lg">Welcome back, {address?.slice(0, 6)}...{address?.slice(-4)}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Tasks</h3>
            <p className="text-3xl font-bold text-blue-600">0</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Appointments</h3>
            <p className="text-3xl font-bold text-blue-500">0</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Pending Payments</h3>
            <p className="text-3xl font-bold text-blue-400">0 PYUSD</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/dashboard/tasks/create"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Create New Task</h3>
            <p className="text-secondary">Set up consultation, procedure, or follow-up tasks</p>
          </Link>

          <Link
            href="/dashboard/tasks"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Manage Tasks</h3>
            <p className="text-secondary">View and edit your existing tasks</p>
          </Link>

          <Link
            href="/dashboard/appointments"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Appointments</h3>
            <p className="text-secondary">View scheduled appointments</p>
          </Link>

          <Link
            href="/dashboard/payments"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-primary mb-2">Payments</h3>
            <p className="text-secondary">Manage crypto payments and approvals</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
