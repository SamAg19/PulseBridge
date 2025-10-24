'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getAppointmentsByPatient, getDoctorById, getReviewsByAppointment, getPrescriptionsByAppointment } from '@/lib/firebase/firestore';
import { Appointment, DoctorProfile } from '@/lib/types';
import ReviewModal from '@/components/ReviewModal';
import PrescriptionViewModal from '@/components/PrescriptionViewModal';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Calendar, CreditCard, Users, Filter, ExternalLink, FileText, Star, X, Clock } from 'lucide-react';

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

  const [prescriptionModal, setPrescriptionModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    doctorName: string;
  }>({
    isOpen: false,
    appointmentId: '',
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

  const handleViewPrescription = (appointmentId: string, doctorName: string) => {
    setPrescriptionModal({
      isOpen: true,
      appointmentId,
      doctorName
    });
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) {
      return;
    }

    try {
      // Import updateAppointmentStatus function
      const { updateAppointmentStatus } = await import('@/lib/firebase/firestore');
      await updateAppointmentStatus(appointmentId, 'cancelled');

      // Refresh appointments
      fetchAppointments();
      alert('Appointment cancelled successfully.');
    } catch (error) {
      console.error('Error cancelling appointment:', error);
      alert('Failed to cancel appointment. Please try again.');
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

  return (
    <ResponsiveLayout 
      userType="patient" 
      title="My Appointments" 
      subtitle="Manage your healthcare appointments"
    >
        {/* Filters */}
        <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200 mb-6">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-blue-600" />
            <h2 className="text-base sm:text-lg font-semibold text-primary">Filter Appointments</h2>
          </div>
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
              <div key={appointment.id || index} className="glass-card rounded-xl p-4 sm:p-6 hover:shadow-xl transition-all duration-300 border border-blue-200">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
                  <div className="flex items-start space-x-3 sm:space-x-4 flex-1">
                    {/* Doctor Avatar */}
                    <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm sm:text-lg flex-shrink-0">
                      {appointment.doctor ?
                        appointment.doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase() :
                        'Dr'
                      }
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base sm:text-lg font-semibold text-primary truncate">
                        Dr. {appointment.doctor?.fullName || 'Unknown Doctor'}
                      </h3>
                      <p className="text-sm sm:text-base text-blue-600 font-medium">
                        {appointment.doctor?.specialization || 'General Medicine'}
                      </p>

                      <div className="mt-3 space-y-2 sm:space-y-3">
                        <div>
                          <div className="flex items-center text-xs sm:text-sm text-secondary mb-1">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Date & Time
                          </div>
                          <div className="font-medium text-primary text-sm sm:text-base">
                            {formatDate(appointment.scheduledDate)}
                          </div>
                          <div className="text-xs sm:text-sm text-secondary">
                            {formatTime(appointment.scheduledTime)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center text-xs sm:text-sm text-secondary mb-1">
                            <CreditCard className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Payment
                          </div>
                          <div className="font-medium text-primary text-sm sm:text-base">
                            {appointment.paymentAmount >= 1 ?
                              `${appointment.paymentAmount} ETH` :
                              `${(appointment.paymentAmount * 1000).toFixed(0)} mETH`
                            }
                          </div>
                          <span className={`inline-block px-2 py-1 text-xs rounded-full ${getPaymentStatusColor(appointment.paymentStatus)}`}>
                            {appointment.paymentStatus.replace('_', ' ')}
                          </span>
                        </div>

                        <div>
                          <div className="flex items-center text-xs sm:text-sm text-secondary mb-1">
                            <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                            Status
                          </div>
                          <div className="font-medium text-primary text-sm sm:text-base">
                            {appointment.status === 'pending' && 'Awaiting Confirmation'}
                            {appointment.status === 'confirmed' && 'Ready for Meeting'}
                            {appointment.status === 'completed' && 'Consultation Complete'}
                            {appointment.status === 'cancelled' && 'Cancelled'}
                          </div>
                          {appointment.status === 'confirmed' && (
                            <div className="text-xs text-secondary mt-1">
                              {(appointment as any).meetingLink ? '✓ Meeting link ready' : '⏳ Waiting for meeting link'}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="lg:text-right lg:flex-shrink-0">
                    <span className={`inline-block px-3 py-1 text-xs sm:text-sm rounded-full font-medium ${getStatusColor(appointment.status)}`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>

                    <div className="mt-4 space-y-2 lg:min-w-[160px]">
                      {appointment.status === 'confirmed' && (
                        <>
                          {(appointment as any).meetingLink ? (
                            <a
                              href={(appointment as any).meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
                            >
                              <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Join Meeting
                            </a>
                          ) : (
                            <button
                              disabled
                              className="block w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm font-medium cursor-not-allowed"
                            >
                              Waiting for Meeting Link
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'completed' && (
                        <>
                          {appointment.hasPrescription && (
                            <button
                              onClick={() => handleViewPrescription(
                                appointment.id || '',
                                appointment.doctor?.fullName || 'Unknown Doctor'
                              )}
                              className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                              <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              View Prescription
                            </button>
                          )}

                          {appointment.hasReview ? (
                            <button
                              disabled
                              className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-xs sm:text-sm font-medium cursor-not-allowed"
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Review Submitted
                            </button>
                          ) : (
                            <button
                              onClick={() => handleLeaveReview(
                                appointment.id || '',
                                appointment.doctorId,
                                appointment.doctor?.fullName || 'Unknown Doctor'
                              )}
                              className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                            >
                              <Star className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
                              Leave Review
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'pending' && (
                        <button
                          onClick={() => handleCancelAppointment(appointment.id || '')}
                          className="flex items-center justify-center w-full px-3 sm:px-4 py-2 bg-red-600 text-white rounded-lg text-xs sm:text-sm font-medium hover:bg-red-700 transition-colors"
                        >
                          <X className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
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
      {/* Review Modal */}
      <ReviewModal
        isOpen={reviewModal.isOpen}
        onClose={() => setReviewModal({ ...reviewModal, isOpen: false })}
        appointmentId={reviewModal.appointmentId}
        doctorId={reviewModal.doctorId}
        doctorName={reviewModal.doctorName}
        onSuccess={handleReviewSuccess}
      />

      {/* Prescription View Modal */}
      <PrescriptionViewModal
        isOpen={prescriptionModal.isOpen}
        onClose={() => setPrescriptionModal({ ...prescriptionModal, isOpen: false })}
        appointmentId={prescriptionModal.appointmentId}
        doctorName={prescriptionModal.doctorName}
      />
    </ResponsiveLayout>
  );
}