'use client';

import { useState, useEffect } from 'react';
import { getAllAppointments, getDoctorById, updateAppointmentMeetingLink } from '@/lib/firebase/firestore';

interface AppointmentWithDetails {
  id: string;
  doctorId: string;
  patientId: string;
  taskId: string;
  scheduledDate: any;
  scheduledTime: string;
  status: string;
  paymentStatus: string;
  paymentAmount: number;
  meetingLink?: string;
  meetingId?: string;
  createdAt: any;
  doctor?: any;
}

export default function AdminDashboard() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [meetingModal, setMeetingModal] = useState<{
    isOpen: boolean;
    appointmentId: string;
    doctorName: string;
    patientId: string;
  }>({
    isOpen: false,
    appointmentId: '',
    doctorName: '',
    patientId: ''
  });
  const [meetingLink, setMeetingLink] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await getAllAppointments();
      
      // Fetch doctor details for each appointment
      const appointmentsWithDetails = await Promise.all(
        appointmentsData.map(async (appointment: any) => {
          try {
            const doctor = await getDoctorById(appointment.doctorId);
            return { ...appointment, doctor } as AppointmentWithDetails;
          } catch (error) {
            console.error('Error fetching doctor:', error);
            return appointment as AppointmentWithDetails;
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

  const handleAddMeetingLink = (appointmentId: string, doctorName: string, patientId: string) => {
    setMeetingModal({
      isOpen: true,
      appointmentId,
      doctorName,
      patientId
    });
    setMeetingLink('');
  };

  const handleSubmitMeetingLink = async () => {
    if (!meetingLink.trim()) {
      alert('Please enter a meeting link');
      return;
    }

    try {
      setIsUpdating(true);
      await updateAppointmentMeetingLink(
        meetingModal.appointmentId,
        meetingLink.trim(),
        `meeting-${Date.now()}`
      );
      
      // Refresh appointments
      await fetchAppointments();
      
      // Close modal
      setMeetingModal({ isOpen: false, appointmentId: '', doctorName: '', patientId: '' });
      setMeetingLink('');
      
      alert('Meeting link added successfully! Both doctor and patient can now access it.');
    } catch (error) {
      console.error('Error updating meeting link:', error);
      alert('Failed to add meeting link. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const generateJitsiLink = () => {
    const roomName = `consultation-${Date.now()}`;
    const jitsiLink = `https://meet.jit.si/${roomName}`;
    setMeetingLink(jitsiLink);
  };

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
      weekday: 'short',
      year: 'numeric',
      month: 'short',
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



  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <header className="glass-card border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
              <p className="text-secondary">Manage appointments and meeting links</p>
            </div>
            <div className="flex items-center space-x-4">
              <a
                href="/admin/doctors"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Doctor Verification
              </a>
              <a
                href="/admin/attendance"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Meeting Attendance
              </a>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Admin Access
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Appointments</h3>
            <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Pending</h3>
            <p className="text-3xl font-bold text-blue-500">{appointments.filter(apt => apt.status === 'pending').length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">With Meeting Links</h3>
            <p className="text-3xl font-bold text-blue-400">{appointments.filter(apt => apt.meetingLink).length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Completed</h3>
            <p className="text-3xl font-bold text-blue-300">{appointments.filter(apt => apt.status === 'completed').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-primary mb-4">Filter Appointments</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Appointments' },
                { key: 'pending', label: 'Pending' },
                { key: 'confirmed', label: 'Confirmed' },
                { key: 'completed', label: 'Completed' }
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

        {/* Appointments Table */}
        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center border border-blue-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading appointments...</p>
          </div>
        ) : filteredAppointments.length > 0 ? (
          <div className="glass-card rounded-xl overflow-hidden border border-blue-200">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Doctor & Patient
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date & Time
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meeting Link
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAppointments.map((appointment) => (
                    <tr key={appointment.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            Dr. {appointment.doctor?.fullName || 'Unknown'}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.doctor?.specialization || 'General'}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Patient: {appointment.patientId.slice(0, 6)}...{appointment.patientId.slice(-4)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {formatDate(appointment.scheduledDate)}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatTime(appointment.scheduledTime)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(appointment.status)}`}>
                          {appointment.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {appointment.meetingLink ? (
                          <div>
                            <a 
                              href={appointment.meetingLink}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-800 text-sm"
                            >
                              View Link
                            </a>
                            <div className="text-xs text-gray-500">
                              ID: {appointment.meetingId}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400 text-sm">No link</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {appointment.status === 'pending' && !appointment.meetingLink && (
                          <button
                            onClick={() => handleAddMeetingLink(
                              appointment.id,
                              appointment.doctor?.fullName || 'Unknown Doctor',
                              appointment.patientId
                            )}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Add Meeting Link
                          </button>
                        )}
                        {appointment.meetingLink && (
                          <span className="text-blue-600">Link Added</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center border border-blue-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a2 2 0 012-2h4a2 2 0 012 2v4m-6 0h6m-6 0l-1 1m7-1l1 1m-6 0v6a2 2 0 002 2h2a2 2 0 002-2V8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No appointments found</h3>
            <p className="text-secondary">
              {filter === 'all' 
                ? "No appointments have been created yet." 
                : `No ${filter} appointments found.`
              }
            </p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mt-8">
          <h2 className="text-xl font-bold text-primary mb-6">Quick Actions</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <a
              href="/admin/doctors"
              className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Doctor Verification</h3>
              <p className="text-secondary">Review and approve doctor registrations</p>
            </a>

            <a
              href="/admin/attendance"
              className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 p-8 text-center transform hover:scale-105 border border-blue-200"
            >
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-primary mb-2">Meeting Attendance</h3>
              <p className="text-secondary">Track participant attendance in meetings</p>
            </a>
          </div>
        </div>
      </div>

      {/* Meeting Link Modal */}
      {meetingModal.isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900">Add Meeting Link</h2>
              <button
                onClick={() => setMeetingModal({ ...meetingModal, isOpen: false })}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="mb-4">
              <p className="text-sm text-gray-600 mb-2">
                <strong>Doctor:</strong> {meetingModal.doctorName}
              </p>
              <p className="text-sm text-gray-600">
                <strong>Patient:</strong> {meetingModal.patientId.slice(0, 6)}...{meetingModal.patientId.slice(-4)}
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meeting Link *
              </label>
              <input
                type="url"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://meet.jit.si/your-room-name"
                required
              />
            </div>

            <div className="mb-6">
              <button
                type="button"
                onClick={generateJitsiLink}
                className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm"
              >
                Generate Jitsi Meeting Link
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setMeetingModal({ ...meetingModal, isOpen: false })}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitMeetingLink}
                disabled={!meetingLink.trim() || isUpdating}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdating ? 'Adding...' : 'Add Link'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}