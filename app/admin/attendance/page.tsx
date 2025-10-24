'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getConfirmedAppointments, getDoctorById, markParticipantJoined, completeMeeting } from '@/lib/firebase/firestore';

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
  attendanceTracking?: any;
  createdAt: any;
  doctor?: any;
}

export default function AdminAttendance() {
  const [appointments, setAppointments] = useState<AppointmentWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingAppointment, setUpdatingAppointment] = useState<string | null>(null);

  useEffect(() => {
    fetchAppointments();
    // Set up polling to refresh data every 30 seconds
    const interval = setInterval(fetchAppointments, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const appointmentsData = await getConfirmedAppointments();
      
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

  const handleMarkJoined = async (appointmentId: string, participantType: 'doctor' | 'patient') => {
    try {
      setUpdatingAppointment(appointmentId);
      await markParticipantJoined(appointmentId, participantType);
      await fetchAppointments(); // Refresh data
      alert(`${participantType.charAt(0).toUpperCase() + participantType.slice(1)} marked as joined!`);
    } catch (error) {
      console.error('Error marking participant joined:', error);
      alert('Failed to update attendance. Please try again.');
    } finally {
      setUpdatingAppointment(null);
    }
  };

  const handleCompleteMeeting = async (appointmentId: string) => {
    try {
      setUpdatingAppointment(appointmentId);
      await completeMeeting(appointmentId);
      await fetchAppointments(); // Refresh data
      alert('Meeting marked as completed!');
    } catch (error) {
      console.error('Error completing meeting:', error);
      alert('Failed to complete meeting. Please try again.');
    } finally {
      setUpdatingAppointment(null);
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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Not joined';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
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
              <h1 className="text-2xl font-bold text-primary">Meeting Attendance</h1>
              <p className="text-secondary">Track participant attendance for confirmed meetings</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Meetings</h3>
            <p className="text-3xl font-bold text-blue-600">{appointments.length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Both Present</h3>
            <p className="text-3xl font-bold text-blue-500">
              {appointments.filter(apt => apt.attendanceTracking?.bothParticipantsPresent).length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">In Progress</h3>
            <p className="text-3xl font-bold text-blue-400">
              {appointments.filter(apt => apt.status === 'confirmed' && apt.attendanceTracking?.bothParticipantsPresent).length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Completed</h3>
            <p className="text-3xl font-bold text-blue-300">
              {appointments.filter(apt => apt.status === 'completed').length}
            </p>
          </div>
        </div>

        {/* Meetings List */}
        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center border border-blue-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading meetings...</p>
          </div>
        ) : appointments.length > 0 ? (
          <div className="space-y-4">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="glass-card rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Meeting Info */}
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {appointment.meetingId ? appointment.meetingId.slice(-4).toUpperCase() : 'MEET'}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        Dr. {appointment.doctor?.fullName || 'Unknown'} & Patient
                      </h3>
                      <p className="text-blue-600 font-medium">
                        {appointment.doctor?.specialization || 'General'}
                      </p>
                      
                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-secondary mb-1">Scheduled</div>
                          <div className="font-medium text-primary">
                            {formatDate(appointment.scheduledDate)} at {formatTime(appointment.scheduledTime)}
                          </div>
                        </div>
                        
                        <div>
                          <div className="text-sm text-secondary mb-1">Meeting Link</div>
                          <div className="font-medium text-primary">
                            {appointment.meetingLink ? (
                              <a 
                                href={appointment.meetingLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                Join Meeting
                              </a>
                            ) : (
                              'No link provided'
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Attendance Status */}
                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-primary">Doctor Attendance</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              appointment.attendanceTracking?.doctorJoined 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {appointment.attendanceTracking?.doctorJoined ? 'Joined' : 'Not Joined'}
                            </span>
                          </div>
                          <div className="text-xs text-secondary">
                            {formatTimestamp(appointment.attendanceTracking?.doctorJoinTime)}
                          </div>
                        </div>

                        <div className="bg-blue-50 rounded-lg p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-primary">Patient Attendance</span>
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              appointment.attendanceTracking?.patientJoined 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {appointment.attendanceTracking?.patientJoined ? 'Joined' : 'Not Joined'}
                            </span>
                          </div>
                          <div className="text-xs text-secondary">
                            {formatTimestamp(appointment.attendanceTracking?.patientJoinTime)}
                          </div>
                        </div>
                      </div>

                      {appointment.attendanceTracking?.bothParticipantsPresent && (
                        <div className="mt-3 bg-green-50 rounded-lg p-3">
                          <div className="flex items-center">
                            <svg className="w-4 h-4 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
                            </svg>
                            <span className="text-sm font-medium text-green-800">Both participants present</span>
                          </div>
                          <div className="text-xs text-green-600 mt-1">
                            Meeting started: {formatTimestamp(appointment.attendanceTracking?.meetingStartTime)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium mb-4 ${
                      appointment.status === 'completed' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {appointment.status.charAt(0).toUpperCase() + appointment.status.slice(1)}
                    </span>

                    <div className="space-y-2">
                      {appointment.status !== 'completed' && (
                        <>
                          {!appointment.attendanceTracking?.doctorJoined && (
                            <button
                              onClick={() => handleMarkJoined(appointment.id, 'doctor')}
                              disabled={updatingAppointment === appointment.id}
                              className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                            >
                              {updatingAppointment === appointment.id ? 'Updating...' : 'Mark Doctor Joined'}
                            </button>
                          )}

                          {!appointment.attendanceTracking?.patientJoined && (
                            <button
                              onClick={() => handleMarkJoined(appointment.id, 'patient')}
                              disabled={updatingAppointment === appointment.id}
                              className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                            >
                              {updatingAppointment === appointment.id ? 'Updating...' : 'Mark Patient Joined'}
                            </button>
                          )}

                          {appointment.attendanceTracking?.bothParticipantsPresent && (
                            <button
                              onClick={() => handleCompleteMeeting(appointment.id)}
                              disabled={updatingAppointment === appointment.id}
                              className="block w-full px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
                            >
                              {updatingAppointment === appointment.id ? 'Updating...' : 'Complete Meeting'}
                            </button>
                          )}
                        </>
                      )}

                      {appointment.status === 'completed' && (
                        <div className="text-sm text-green-600 font-medium">
                          ✓ Meeting Completed
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
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No confirmed meetings</h3>
            <p className="text-secondary">
              No meetings are currently scheduled or confirmed.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}