'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getAppointmentsByPatient, getDoctorById } from '@/lib/firebase/firestore';

interface PaymentRecord {
  id: string;
  appointmentId: string;
  doctorName: string;
  doctorSpecialization: string;
  amount: number;
  status: string;
  date: any;
  transactionHash?: string;
}

export default function PatientPayments() {
  const { address, isConnected } = useAccount();
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'pending' | 'approved'>('all');

  useEffect(() => {
    if (isConnected && address) {
      fetchPayments();
    }
  }, [isConnected, address]);

  const fetchPayments = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const appointmentsData = await getAppointmentsByPatient(address);
      
      // Transform appointments into payment records
      const paymentRecords = await Promise.all(
        appointmentsData.map(async (appointment: any) => {
          try {
            const doctor = await getDoctorById(appointment.doctorId);
            return {
              id: appointment.id,
              appointmentId: appointment.id,
              doctorName: doctor.fullName,
              doctorSpecialization: doctor.specialization,
              amount: appointment.paymentAmount,
              status: appointment.paymentStatus,
              date: appointment.createdAt,
              transactionHash: appointment.transactionHash
            } as PaymentRecord;
          } catch (error) {
            console.error('Error fetching doctor for payment:', error);
            return null;
          }
        })
      );

      setPayments(paymentRecords.filter(Boolean) as PaymentRecord[]);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPayments = payments.filter(payment => 
    filter === 'all' || payment.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatAmount = (amount: number) => {
    return amount >= 1 ? `${amount} ETH` : `${(amount * 1000).toFixed(0)} mETH`;
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const totalPaid = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to view your payment history.</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <header className="glass-card border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Payment History</h1>
              <p className="text-secondary">Track your healthcare payments and transactions</p>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/patient/appointments" 
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                View Appointments
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Payment Summary */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Paid</h3>
            <p className="text-3xl font-bold text-blue-600">{formatAmount(totalPaid)}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Transactions</h3>
            <p className="text-3xl font-bold text-blue-500">{payments.length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Completed</h3>
            <p className="text-3xl font-bold text-blue-400">{payments.filter(p => p.status === 'completed').length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Pending</h3>
            <p className="text-3xl font-bold text-blue-300">{payments.filter(p => p.status === 'pending_approval').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-primary mb-4">Filter Payments</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Payments' },
                { key: 'completed', label: 'Completed' },
                { key: 'approved', label: 'Approved' },
                { key: 'pending_approval', label: 'Pending' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
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
        </div>

        {/* Payments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredPayments.length > 0 ? (
          <div className="glass-card rounded-xl overflow-hidden border border-blue-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredPayments.map((payment) => (
                    <tr key={payment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {payment.doctorName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {payment.doctorSpecialization}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatAmount(payment.amount)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(payment.status)}`}>
                          {payment.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(payment.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {payment.transactionHash ? (
                          <a 
                            href={`https://etherscan.io/tx/${payment.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            View on Etherscan
                          </a>
                        ) : (
                          'N/A'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No payments found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all' 
                ? "You haven't made any payments yet." 
                : `No ${filter} payments found.`
              }
            </p>
            <a 
              href="/patient"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book an Appointment
            </a>
          </div>
        )}
      </div>
    </div>
  );
}