'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useDisconnect } from 'wagmi';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Plus, FileText, Calendar, CreditCard, Users, Clock, DollarSign, TrendingUp } from 'lucide-react';

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalTasks: 0,
    totalAppointments: 0,
    pendingPayments: 0,
    completedAppointments: 0
  });

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
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout 
      userType="doctor" 
      title="Doctor Dashboard" 
      subtitle={`Welcome back, Dr. ${address?.slice(0, 6)}...${address?.slice(-4)}`}
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Services</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.totalTasks}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Appointments</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.totalAppointments}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Pending Payments</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.pendingPayments}</p>
            </div>
          </div>
        </div>
        
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Completed</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">{stats.completedAppointments}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <Link
            href="/dashboard/tasks/create"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-blue-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Add time slots</h3>
            <p className="text-secondary text-sm sm:text-base">Add time slots for patients to schedule the session</p>
          </Link>
          <Link
            href="/dashboard/appointments"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-blue-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">View Appointments</h3>
            <p className="text-secondary text-sm sm:text-base">Manage your scheduled appointments</p>
          </Link>

          <Link
            href="/dashboard/payments"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-blue-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-orange-200 transition-colors">
              <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-orange-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Payment Management</h3>
            <p className="text-secondary text-sm sm:text-base">Track earnings and payment approvals</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Recent Activity</h2>
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="text-center py-8 sm:py-12">
            <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No Recent Activity</h3>
            <p className="text-secondary text-sm sm:text-base">Your recent appointments and activities will appear here</p>
          </div>
        </div>
      </div>
    </ResponsiveLayout>
  );
}
