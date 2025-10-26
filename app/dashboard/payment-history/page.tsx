'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Calendar, Filter, DollarSign, Receipt, TrendingUp } from 'lucide-react';
import { getDoctorSessionsWithDetails } from '@/lib/contracts/utils';
import { useGetDoctorID } from '@/lib/contracts/hooks';
import { Session } from '@/lib/types';

export default function DoctorPaymentHistory() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
  const [stats, setStats] = useState({
    totalEarned: 0,
    totalTransactions: 0,
    completedTransactions: 0,
    pendingTransactions: 0,
  });

  const { doctorId, isLoading: loadingDoctorId } = useGetDoctorID(address);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (doctorId && doctorId > 0) {
      fetchPaymentHistory();
    }
  }, [doctorId, isConnected, router]);

  useEffect(() => {
    // Apply filter
    if (filter === 'all') {
      setFilteredSessions(sessions);
    } else if (filter === 'completed') {
      setFilteredSessions(sessions.filter(s => s.prescriptionIPFSHash && s.prescriptionIPFSHash.length > 0));
    } else {
      setFilteredSessions(sessions.filter(s => !s.prescriptionIPFSHash || s.prescriptionIPFSHash.length === 0));
    }
  }, [filter, sessions]);

  const fetchPaymentHistory = async () => {
    if (!doctorId || doctorId === 0) return;

    try {
      setLoading(true);
      const sessionsData = await getDoctorSessionsWithDetails(chainId, doctorId);

      // Calculate statistics
      const completedSessions = sessionsData.filter(s => s.prescriptionIPFSHash && s.prescriptionIPFSHash.length > 0);
      const totalEarned = completedSessions.reduce((sum, session) => sum + session.pyusdAmount, 0);

      setStats({
        totalEarned,
        totalTransactions: sessionsData.length,
        completedTransactions: completedSessions.length,
        pendingTransactions: sessionsData.length - completedSessions.length,
      });

      // Sort by creation time (most recent first)
      const sorted = [...sessionsData].sort((a, b) => b.createdAt - a.createdAt);
      setSessions(sorted);
      setFilteredSessions(sorted);

    } catch (error) {
      console.error('Error fetching payment history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
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

  const getStatusBadge = (session: Session) => {
    const hasPrescription = session.prescriptionIPFSHash && session.prescriptionIPFSHash.length > 0;
    
    if (hasPrescription) {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-600 text-white">
          Released
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          In Escrow
        </span>
      );
    }
  };

  if (!isConnected || loadingDoctorId) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading...</p>
        </div>
      </div>
    );
  }

  if (!doctorId || doctorId === 0) {
    return (
      <ResponsiveLayout
        userType="doctor"
        title="Payment History"
        subtitle="Track your earnings and transactions"
      >
        <div className="glass-card rounded-xl p-12 text-center border border-red-200">
          <h3 className="text-lg font-medium text-red-600 mb-2">Not Registered</h3>
          <p className="text-secondary mb-4">
            You need to register as a doctor and be approved to view payment history.
          </p>
        </div>
      </ResponsiveLayout>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-secondary">Loading payment history...</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout
      userType="doctor"
      title="Payment History"
      subtitle="Track your earnings and transactions"
    >
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Receipt className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Transactions</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{stats.totalTransactions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Total Earned</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.totalEarned.toFixed(2)}</p>
              <p className="text-xs text-secondary">PYUSD</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-emerald-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">Completed</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.completedTransactions}</p>
            </div>
          </div>
        </div>

        <div className="glass-card rounded-xl p-4 sm:p-6 border border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-primary">In Escrow</h3>
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-yellow-600">{stats.pendingTransactions}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-primary">Filter Transactions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Transactions' },
            { key: 'completed', label: 'Payment Released' },
            { key: 'pending', label: 'In Escrow' }
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

      {/* Payment History List */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-primary mb-4 sm:mb-6">Transaction History</h2>

        {filteredSessions.length > 0 ? (
          <div className="glass-card rounded-xl border border-blue-200 overflow-hidden">
            {filteredSessions.map((session, index) => {
              const hasPrescription = session.prescriptionIPFSHash && session.prescriptionIPFSHash.length > 0;
              return (
                <div key={session.sessionId}>
                  <div className="px-4 sm:px-6 py-4 hover:bg-blue-50 transition-colors cursor-pointer">
                    {/* Main Row */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4 flex-1">
                        {/* Icon */}
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${hasPrescription ? 'bg-blue-600' : 'bg-blue-400'
                          }`}>
                          <DollarSign className="w-6 h-6 text-white" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-lg font-semibold text-gray-900">
                              Session #{session.sessionId}
                            </h3>
                            <div className="text-right">
                              <div className="text-xl font-bold text-gray-900">
                                +{session.pyusdAmount.toFixed(2)} PYUSD
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600 font-mono">
                              {session.patient.slice(0, 8)}...{session.patient.slice(-6)}
                            </span>
                            <span className={`font-medium ${hasPrescription ? 'text-blue-600' : 'text-blue-500'
                              }`}>
                              {hasPrescription ? 'Released' : 'In Escrow'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Secondary Info */}
                    <div className="ml-16 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Payment Received</span>
                        <span className="text-gray-700 font-medium">
                          {formatDate(session.createdAt)} • {formatTime(session.createdAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Consultation Date</span>
                        <span className="text-gray-700 font-medium">
                          {formatDate(session.startTime)} • {formatTime(session.startTime)}
                        </span>
                      </div>
                      {hasPrescription && (
                        <div className="flex items-center text-sm text-blue-600 pt-1">
                          <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="font-medium">Payment released to wallet</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  {index < filteredSessions.length - 1 && (
                    <div className="border-b border-blue-100"></div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-6 sm:p-12 text-center border border-blue-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No transactions found</h3>
            <p className="text-secondary mb-4 text-sm sm:text-base">
              {filter === 'all'
                ? "You don't have any payment transactions yet."
                : `No ${filter} transactions found.`
              }
            </p>
          </div>
        )}
      </div>
    </ResponsiveLayout>
  );
}
