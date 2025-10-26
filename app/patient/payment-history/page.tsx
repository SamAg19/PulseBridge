'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Calendar, DollarSign, ArrowUpRight, Filter, Receipt } from 'lucide-react';
import { getPatientSessionsWithDetails } from '@/lib/contracts/utils';
import { Session } from '@/lib/types';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export default function PatientPaymentHistoryPage() {
    const { address, isConnected } = useAccount();
    const chainId = useChainId();
    const router = useRouter();

    const [sessions, setSessions] = useState<Session[]>([]);
    const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'completed' | 'pending'>('all');
    const [stats, setStats] = useState({
        totalPaid: 0,
        totalTransactions: 0,
        completedTransactions: 0,
        pendingTransactions: 0,
    });

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        if (address) {
            fetchPaymentHistory();
        }
    }, [isConnected, address, router]);

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
        if (!address) return;

        try {
            setLoading(true);
            const sessionsData = await getPatientSessionsWithDetails(chainId, address);

            // Calculate statistics
            const totalPaid = sessionsData.reduce((sum, session) => sum + session.pyusdAmount, 0);
            const completedTransactions = sessionsData.filter(s => s.prescriptionIPFSHash && s.prescriptionIPFSHash.length > 0).length;
            const pendingTransactions = sessionsData.length - completedTransactions;

            setStats({
                totalPaid,
                totalTransactions: sessionsData.length,
                completedTransactions,
                pendingTransactions,
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
                    Completed
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

    if (!isConnected) {
        return (
            <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
                <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
                    <div className="mb-6">
                        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Receipt className="w-8 h-8 text-blue-600" />
                        </div>
                        <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Connect Your Wallet</h1>
                        <p className="text-secondary text-sm sm:text-base">Please connect your wallet to view your payment history.</p>
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
                    <p className="text-secondary">Loading payment history...</p>
                </div>
            </div>
        );
    }

    return (
        <ResponsiveLayout
            userType="patient"
            title="Payment History"
            subtitle={`Transaction history for ${address?.slice(0, 6)}...${address?.slice(-4)}`}
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

                <div className="glass-card rounded-xl p-4 sm:p-6 border border-emerald-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                            <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-600" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-semibold text-primary">Total Paid</h3>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-600">{stats.totalPaid.toFixed(2)}</p>
                            <p className="text-xs text-secondary">PYUSD</p>
                        </div>
                    </div>
                </div>

                <div className="glass-card rounded-xl p-4 sm:p-6 border border-green-200">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <ArrowUpRight className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
                        </div>
                        <div>
                            <h3 className="text-sm sm:text-base font-semibold text-primary">Completed</h3>
                            <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">{stats.completedTransactions}</p>
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
                        { key: 'completed', label: 'Completed' },
                        { key: 'pending', label: 'In Escrow' }
                    ].map((filterOption) => (
                        <button
                            key={filterOption.key}
                            onClick={() => setFilter(filterOption.key as any)}
                            className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${filter === filterOption.key
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
                                                    <Receipt className="w-6 h-6 text-white" />
                                                </div>

                                                {/* Details */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center justify-between mb-1">
                                                        <h3 className="text-lg font-semibold text-gray-900">
                                                            Session #{session.sessionId}
                                                        </h3>
                                                        <div className="text-right">
                                                            <div className="text-xl font-bold text-gray-900">
                                                                {session.pyusdAmount.toFixed(2)} PYUSD
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-gray-600">
                                                            Doctor ID: {session.doctorId}
                                                        </span>
                                                        <span className={`font-medium ${hasPrescription ? 'text-blue-600' : 'text-blue-500'
                                                            }`}>
                                                            {hasPrescription ? 'Completed' : 'In Escrow'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Secondary Info */}
                                        <div className="ml-16 space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500">Payment Date</span>
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
                                                    <span className="font-medium">Payment released • Prescription available</span>
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
                                ? "You haven't made any payments yet."
                                : `No ${filter} transactions found.`
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
