'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getAppointmentsByDoctor, getPrescriptionsByAppointment } from '@/lib/firebase/firestore';
import PrescriptionModal from '@/components/PrescriptionModal';

interface AppointmentWithDetails {
  id: string;
  patientId: string;
  taskId: string;
  scheduledDate: any;
  scheduledTime: string;
  status: string;
  paymentStatus: string;
  paymentAmount: number;
  createdAt: any;
  hasPrescription: boolean;
}

export default function DoctorAppointments() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [prescriptionModal, setPrescriptionModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    patientId: string;
    patientName: string;
  }>({
    isOpen: false,
    appointmentId: '',
    patientId: '',
    patientName: ''
  });

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (address) {
      fetchAppointments();
    }
  }, [address, isConnected, router]);

  const fetchAppointments = async () => {
    if (!address) return;

    try {
      setLoading(true);
      const appointmentsData = await getAppointmentsByDoctor(address);
      
      // Check for prescriptions for each appointment
      const appointmentsWithDetails = await Promise.all(
        appointmentsData.map(async (appointment: any) => {
          try {
            const prescriptions = await getPrescriptionsByAppointment(appointment.id);
            return {
              ...appointment,
              hasPrescription: prescriptions.length > 0
            } as AppointmentWithDetails;
          } catch (error) {
            console.error('Error checking prescriptions:', error);
            return {
              ...appointment,
              hasPrescription: false
            } as AppointmentWithDetails;
          }
        })
      );

      setAppointments(appointmentsWithDetails);
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

  const formatAmount = (amount: number) => {
    return amount >= 1 ? `${amount} ETH` : `${(amount * 1000).toFixed(0)} mETH`;
  };

  const handleCreatePrescription = (appointmentId: string, patientId: string) => {
    setPrescriptionModal({
      isOpen: true,
      appointmentId,
      patientId,
      patientName: `Patient ${patientId.slice(0, 6)}...${patientId.slice(-4)}`
    });
  };

  const handlePrescriptionSuccess = () => {
    fetchAppointments(); // Refresh to update prescription status
  };

  if (!isConnected) return null;

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Navigation */}
      <nav className="glass-card border-b border-blue-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-primary mb-2">My Appointments</h1>
          <p className="text-secondary text-lg">Manage patient appointments and consultations</p>
        </div>

        {/* Statistics */}
        {appointments.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card rounded-xl p-4 border border-blue-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-primary">{appointments.length}</div>
                  <div className="text-sm text-secondary">Total Appointments</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-green-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {appointments.filter(apt => apt.status === 'completed').length}
                  </div>
                  <div className="text-sm text-secondary">Completed</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-yellow-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {appointments.filter(apt => apt.status === 'pending').length}
                  </div>
                  <div className="text-sm text-secondary">Pending</div>
                </div>
              </div>
            </div>

            <div className="glass-card rounded-xl p-4 border border-purple-200">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {appointments.filter(apt => apt.hasPrescription).length}
                  </div>
                  <div className="text-sm text-secondary">Prescriptions</div>
                </div>
              </div>
            </div>
          </div>
        )}

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
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    filter === filterOption.key
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
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
              <div key={i} className="glass-card rounded-xl p-6 animate-pulse border border-blue-200">
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
            {filteredAppointments.map((appointment) => (
              <div key={appointment.id} className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Patient Avatar */}
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                      {appointment.patientId.slice(0, 2).toUpperCase()}
                    </div>

                    {/* Appointment Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        Patient: {appointment.patientId.slice(0, 6)}...{appointment.patientId.slice(-4)}
                      </h3>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <div className="flex items-center text-sm text-secondary mb-1">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
                            </svg>
                            Date & Time
                          </div>
                          <div className="font-medium text-primary">
                            {formatDate(appointment.scheduledDate)}
                          </div>
                          <div className="text-sm text-secondary">
                            {formatTime(appointment.scheduledTime)}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center text-sm text-secondary mb-1">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                            </svg>
                            Payment
                          </div>
                          <div className="font-medium text-primary">
                            {formatAmount(appointment.paymentAmount)}
                          </div>
                          <div className="text-sm text-secondary">
                            {appointment.paymentStatus.replace('_', ' ')}
                          </div>
                        </div>

                        <div>
                          <div className="flex items-center text-sm text-secondary mb-1">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Prescription
                          </div>
                          <div className="font-medium text-primary">
                            {appointment.hasPrescription ? 'Created' : 'Not Created'}
                          </div>
                        </div>
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
                          {appointment.hasPrescription ? (
                            <button 
                              disabled
                              className="block w-full px-4 py-2 bg-gray-300 text-gray-500 rounded-lg text-sm font-medium cursor-not-allowed"
                            >
                              Prescription Created
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleCreatePrescription(appointment.id, appointment.patientId)}
                              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors"
                            >
                              Create Prescription
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'pending' && (
                        <div className="space-y-2">
                          <button className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
                            Confirm
                          </button>
                          <button className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                            Cancel
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center border border-blue-200">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No appointments found</h3>
            <p className="text-secondary mb-4">
              {filter === 'all' 
                ? "You don't have any appointments yet." 
                : `No ${filter} appointments found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Prescription Modal */}
      <PrescriptionModal
        isOpen={prescriptionModal.isOpen}
        onClose={() => setPrescriptionModal({ ...prescriptionModal, isOpen: false })}
        appointmentId={prescriptionModal.appointmentId}
        patientId={prescriptionModal.patientId}
        patientName={prescriptionModal.patientName}
        onSuccess={handlePrescriptionSuccess}
      />
    </div>
  );
}