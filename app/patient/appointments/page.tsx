'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Calendar, Clock, TrendingUp, DollarSign, Filter } from 'lucide-react';
import { getPatientSessionsWithDetails } from '@/lib/contracts/utils';
import { Session } from '@/lib/types';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface SessionWithStatus extends Session {
  computedStatus: 'confirmed' | 'pending' | 'completed';
}

export default function PatientAppointmentsPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const [stats, setStats] = useState({
    totalSessions: 0,
    confirmedSessions: 0,
    pendingSessions: 0,
    completedSessions: 0,
    totalSpent: 0
  });
  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<SessionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'confirmed' | 'pending' | 'completed'>('all');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (address) {
      fetchSessionsData();
    }
  }, [isConnected, address, router]);

  useEffect(() => {
    // Apply filter
    if (filter === 'all') {
      setFilteredSessions(sessions);
    } else {
      setFilteredSessions(sessions.filter(s => s.computedStatus === filter));
    }
  }, [filter, sessions]);

  const fetchSessionsData = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const sessionsData = await getPatientSessionsWithDetails(chainId, address);

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
      const totalSpent = sessionsWithStatus.reduce((sum, session) => sum + session.pyusdAmount, 0);

      setStats({
        totalSessions: sessionsWithStatus.length,
        confirmedSessions: sessionsWithStatus.filter(s => s.computedStatus === 'confirmed').length,
        pendingSessions: sessionsWithStatus.filter(s => s.computedStatus === 'pending').length,
        completedSessions: completedSessions.length,
        totalSpent: totalSpent
      });

      // Sort by start time (most recent first)
      const sorted = [...sessionsWithStatus].sort((a, b) => b.startTime - a.startTime);
      setSessions(sorted);
      setFilteredSessions(sorted);

    } catch (error) {
      console.error('Error fetching sessions data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Connect Your Wallet</h1>
            <p className="text-secondary text-sm sm:text-base">Please connect your wallet to view your appointments.</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading your appointments...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      userType="patient"
      title="My Appointments"
      subtitle={`Welcome back, ${address?.slice(0, 6)}...${address?.slice(-4)}`}
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
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Spent</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.totalSpent.toFixed(2)}</p>
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
              <h3 className="text-sm sm:text-base font-semibold text-primary">In Progress</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.pendingSessions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-purple-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Upcoming</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-purple-600">{stats.confirmedSessions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-primary">Filter Appointments</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Appointments' },
            { key: 'confirmed', label: 'Upcoming' },
            { key: 'pending', label: 'In Progress' },
            { key: 'completed', label: 'Completed' }
          ].map((filterOption) => (
            <button
              key={filterOption.key}
              onClick={() => setFilter(filterOption.key as any)}
              className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
                filter === filterOption.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
              }`}
            >
              {filterOption.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appointments List */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Your Appointments</h2>

        {filteredSessions.length > 0 ? (
          <div className="space-y-4">
            {filteredSessions.map((session) => (
              <div
                key={session.sessionId}
                className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-sm sm:text-lg">
                      Dr
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base sm:text-lg font-semibold text-primary mb-1">
                        Session #{session.sessionId}
                      </h3>
                      <p className="text-sm text-secondary mb-3">
                        Doctor ID: {session.doctorId}
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <div className="flex items-center text-xs text-secondary mb-1">
                            <Calendar className="w-4 h-4 mr-2" />
                            Date & Time
                          </div>
                          <div className="text-sm font-medium text-primary">
                            {formatDate(session.startTime)}
                          </div>
                          <div className="text-xs text-secondary">
                            {formatTime(session.startTime)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center text-xs text-secondary mb-1">
                            <DollarSign className="w-4 h-4 mr-2" />
                            Payment Amount
                          </div>
                          <div className="text-sm font-medium text-primary">
                            {session.pyusdAmount.toFixed(2)} PYUSD
                          </div>
                        </div>
                      </div>

                      {session.prescriptionIPFSHash && session.prescriptionIPFSHash.length > 0 && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg border border-green-200">
                          <p className="text-xs text-green-800 font-medium">
                            ✓ Prescription Available
                          </p>
                          <p className="text-xs text-green-700 mt-1 truncate">
                            IPFS: {session.prescriptionIPFSHash}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="ml-4">
                    <span className={`px-3 py-1 text-xs sm:text-sm rounded-full font-medium whitespace-nowrap ${getStatusColor(session.computedStatus)}`}>
                      {session.computedStatus.charAt(0).toUpperCase() + session.computedStatus.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 sm:p-12 text-center border border-blue-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No appointments found</h3>
            <p className="text-secondary mb-4 text-sm sm:text-base">
              {filter === 'all'
                ? "You haven't booked any appointments yet."
                : `No ${filter} appointments found.`
              }
            </p>
            <a
              href="/patient"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Book Your First Appointment
            </a>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
