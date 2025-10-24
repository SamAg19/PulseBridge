'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getAppointmentsByPatient, getDoctorById, getReviewsByAppointment, getPrescriptionsByAppointment } from '@/lib/firebase/firestore';
import { Appointment, DoctorProfile } from '@/lib/types';
import ReviewModal from '@/components/ReviewModal';

interface AppointmentWithDoctor extends Appointment {
  id?: string;
  doctor?: DoctorProfile;
  hasReview?: boolean;
  hasPrescription?: boolean;
}

export default function PatientAppointments() {
  const { address, isConnected } = useAccount();
  const [appointments, setAppointments] = useState<AppointmentWithDoctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [reviewModal, setReviewModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    doctorId: string;
    doctorName: string;
  }>({
    isOpen: false,
    appointmentId: '',
    doctorId: '',
    doctorName: ''
  });

  useEffect(() => {
    if (isConnected && address) {
      fetchAppointments();
    }
  }, [isConnected, address]);

  const fetchAppointments = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const appointmentsData = await getAppointmentsByPatient(address);

      // Fetch doctor details, reviews, and prescriptions for each appointment
      const appointmentsWithDoctors = await Promise.all(
        appointmentsData.map(async (appointment: any) => {
          try {
            const [doctor, reviews, prescriptions] = await Promise.all([
              getDoctorById(appointment.doctorId),
              getReviewsByAppointment(appointment.id),
              getPrescriptionsByAppointment(appointment.id)
            ]);

            return {
              ...appointment,
              doctor,
              hasReview: reviews.length > 0,
              hasPrescription: prescriptions.length > 0
            } as AppointmentWithDoctor;
          } catch (error) {
            console.error('Error fetching appointment details:', error);
            return appointment as AppointmentWithDoctor;
          }
        })
      );

      setAppointments(appointmentsWithDoctors);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredAppointments = appointments.filter(appointment =>
    filter === 'all' || appointment.status === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return 'N/A';
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const handleLeaveReview = (appointmentId: string, doctorId: string, doctorName: string) => {
    setReviewModal({
      isOpen: true,
      appointmentId,
      doctorId,
      doctorName
    });
  };

  const handleReviewSuccess = () => {
    // Refresh appointments to update review status
    fetchAppointments();
  };

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
            <p className="text-gray-600">Please connect your wallet to view your appointments.</p>
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
              <h1 className="text-2xl font-bold text-primary">My Appointments</h1>
              <p className="text-secondary">Manage your healthcare appointments</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/patient"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Book New Appointment
              </a>
              <a
                href="/patient/payments"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Payment History
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-primary mb-4">Filter Appointments</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Appointments' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' },
                { key: 'cancelled', label: 'Cancelled' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === filterOption.key
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

        {/* Appointments List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="space-y-4">
            {filteredAppointments.map((appointment, index) => (
              <div key={appointment.id || index} className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-blue-200 transform hover:scale-105">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Doctor Avatar */}
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {appointment.doctor ?
                        appointment.doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase() :
                        'Dr'
                      }
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        Dr. {appointment.doctor?.fullName || 'Unknown Doctor'}
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {appointment.doctor?.specialization || 'General Medicine'}
                      </p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
                            </svg>
                            Date & Time
                          </div>
                          <div className="font-medium text-gray-900">
                            {formatDate(appointment.scheduledDate)}
                          </div>
                          <div className="text-sm text-gray-600">
                            {formatTime(appointment.scheduledTime)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center text-sm text-gray-600 mb-1">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Payment
                          </div>
                          <div className="font-medium text-gray-900">
                            {appointment.paymentAmount >= 1 ?
                              `${appointment.paymentAmount} ETH` :
                              `${(appointment.paymentAmount * 1000).toFixed(0)} mETH`
                            }
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                            {appointment.paymentStatus.replace('_', ' ')}
                          </span>
                        </div>

                        {appointment.status === 'confirmed' && (
                          <div>
                            <div className="flex items-center text-sm text-gray-600 mb-1">
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                              </svg>
                              Meeting
                            </div>
                            <div className="font-medium text-gray-900">
                              {(appointment as any).meetingLink ? 'Link Available' : 'Pending'}
                            </div>
                            {(appointment as any).meetingId && (
                              <div className="text-xs text-gray-500">
                                ID: {(appointment as any).meetingId}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>

                    <div className="mt-4 space-y-2">
                      {appointment.status === 'confirmed' && (
                        <>
                          {(appointment as any).meetingLink ? (
                            <a
                              href={(appointment as any).meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors text-center"
                            >
                              Join Meeting
                            </a>
                          ) : (
                            <button
                              disabled
                              className="block w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Waiting for Meeting Link
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'completed' && (
                        <>
                          {appointment.hasPrescription && (
                            <button className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors">
                              View Prescription
                            </button>
                          )}

                          {appointment.hasReview ? (
                            <button
                              disabled
                              className="block w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Review Submitted
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLeaveReview(
                                appointment.id || '',
                                appointment.doctorId,
                                appointment.doctor?.fullName || 'Unknown Doctor'
                              )}
                              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              Leave Review
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'pending' && (
                        <button className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No appointments found</h3>
            <p className="text-gray-600 mb-4">
              {filter === 'all'
                ? "You haven't booked any appointments yet."
                : `No ${filter} appointments found.`
              }
            </p>
            <a
              href="/patient"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Book Your First Appointment
            </a>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        appointmentId={reviewModal.appointmentId}
        doctorId={reviewModal.doctorId}
        doctorName={reviewModal.doctorName}
        onSuccess={handleReviewSuccess}
      />
    </div>
  );
}