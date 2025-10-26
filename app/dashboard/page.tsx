'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useChainId } from 'wagmi';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Plus, Calendar, Users, Clock, TrendingUp, DollarSign } from 'lucide-react';
import { getDoctorSessionsWithDetails } from '@/lib/contracts/utils';
import { useGetDoctorID } from '@/lib/contracts/hooks';
import { Session } from '@/lib/types';

interface SessionWithStatus extends Session {
  computedStatus: 'confirmed' | 'pending' | 'completed';
}

export default function DashboardPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalSessions: 0,
    confirmedSessions: 0,
    pendingSessions: 0,
    completedSessions: 0,
    totalEarnings: 0
  });
  const [recentSessions, setRecentSessions] = useState<SessionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);

  const { doctorId, isLoading: loadingDoctorId } = useGetDoctorID(address);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (doctorId && doctorId > 0) {
      fetchDashboardData();
    } else if (!loadingDoctorId) {
      setLoading(false);
    }
  }, [isConnected, doctorId, loadingDoctorId, router]);

  const fetchDashboardData = async () => {
    if (!doctorId || doctorId === 0) return;

    try {
      setLoading(true);
      const sessionsData = await getDoctorSessionsWithDetails(chainId, doctorId);

      // Calculate status for each session
      const sessionsWithStatus: SessionWithStatus[] = sessionsData.map(session => {
        const now = Math.floor(Date.now() / 1000);
        const hasStarted = session.startTime <= now;
        const hasPrescription = session.prescriptionIPFSHash && session.prescriptionIPFSHash.length > 0;

        let computedStatus: 'confirmed' | 'pending' | 'completed';
        if (hasPrescription) {
          computedStatus = 'completed';
        } else if (hasStarted) {
          computedStatus = 'pending';
        } else {
          computedStatus = 'confirmed';
        }

        return { ...session, computedStatus };
      });

      // Calculate statistics
      const completedSessions = sessionsWithStatus.filter(s => s.computedStatus === 'completed');
      const totalEarnings = completedSessions.reduce((sum, session) => sum + session.pyusdAmount, 0);

      setStats({
        totalSessions: sessionsWithStatus.length,
        confirmedSessions: sessionsWithStatus.filter(s => s.computedStatus === 'confirmed').length,
        pendingSessions: sessionsWithStatus.filter(s => s.computedStatus === 'pending').length,
        completedSessions: completedSessions.length,
        totalEarnings: totalEarnings
      });

      // Get 5 most recent sessions (sorted by createdAt desc)
      const sorted = [...sessionsWithStatus].sort((a, b) => b.createdAt - a.createdAt);
      setRecentSessions(sorted.slice(0, 5));

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!isConnected || loadingDoctorId || loading) {
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 sm:gap-6">
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Sessions</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.totalSessions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Earnings</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.totalEarnings.toFixed(2)}</p>
              <p className="text-xs text-secondary">PYUSD</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Completed</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.completedSessions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Awaiting Action</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.pendingSessions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Upcoming</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.confirmedSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Link
            href="/dashboard/tasks/create"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-blue-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
              <Plus className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Add Time Slots</h3>
            <p className="text-secondary text-sm sm:text-base">Add available time slots for patient bookings</p>
          </Link>

          <Link
            href="/dashboard/slots"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-green-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
              <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">Manage Slots</h3>
            <p className="text-secondary text-sm sm:text-base">View and delete your time slots</p>
          </Link>

          <Link
            href="/dashboard/appointments"
            className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-6 sm:p-8 text-center transform hover:scale-105 border border-purple-200 group"
          >
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-primary mb-2">View Sessions</h3>
            <p className="text-secondary text-sm sm:text-base">Manage your consultation sessions</p>
          </Link>
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-primary">Recent Sessions</h2>
          {recentSessions.length > 0 && (
            <Link
              href="/dashboard/appointments"
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View All →
            </Link>
          )}
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          {recentSessions.length > 0 ? (
            <div className="space-y-3">
              {recentSessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex items-center justify-between p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors"
                >
                  <div className="flex items-center space-x-3 flex-1">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-sm">
                      {session.patient.slice(2, 4).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-primary truncate">
                        Session #{session.sessionId}
                      </p>
                      <p className="text-xs text-secondary">
                        {formatDate(session.startTime)} • {session.pyusdAmount} PYUSD
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${getStatusColor(session.computedStatus)}`}>
                    {session.computedStatus.charAt(0).toUpperCase() + session.computedStatus.slice(1)}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 sm:py-12">
              <Users className="w-12 h-12 sm:w-16 sm:h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No Recent Sessions</h3>
              <p className="text-secondary text-sm sm:text-base">Your recent consultation sessions will appear here</p>
            </div>
          )}
        </div>
      </div>
    </ResponsiveLayout>
  );
}
