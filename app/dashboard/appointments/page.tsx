'use client';

import { useState, useEffect } from 'react';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { useRouter } from 'next/navigation';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Calendar, Filter, Users, Clock, FileText } from 'lucide-react';
import { getDoctorSessionsWithDetails } from '@/lib/contracts/utils';
import { useGetDoctorID, useReleasePayment } from '@/lib/contracts/hooks';
import { Session } from '@/lib/types';
import { readContract } from '@wagmi/core';
import { chains, DoctorRegistry } from '@/lib/constants';

interface SessionWithStatus extends Session {
  computedStatus: 'confirmed' | 'pending' | 'completed';
}

export default function DoctorAppointments() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();
  const router = useRouter();

  const [sessions, setSessions] = useState<SessionWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const [prescriptionIPFS, setPrescriptionIPFS] = useState<Record<number, string>>({});

  // Prescription form states
  const [showPrescriptionForm, setShowPrescriptionForm] = useState<Record<number, boolean>>({});
  const [prescriptionData, setPrescriptionData] = useState<Record<number, {
    patientIssues: string;
    diagnosis: string;
    treatment: string;
    prescription: string;
  }>>({});
  const [uploadingPrescription, setUploadingPrescription] = useState<Record<number, boolean>>({});

  const { doctorId, isLoading: loadingDoctorId } = useGetDoctorID(address);
  const { releasePayment, isPending: isReleasingPayment } = useReleasePayment();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    if (doctorId && doctorId > 0) {
      fetchSessions();
    }
  }, [doctorId, isConnected, router]);

  const fetchSessions = async () => {
    if (!doctorId || doctorId === 0) return;

    try {
      setLoading(true);
      const sessionsData = await getDoctorSessionsWithDetails(chainId, doctorId);

      // Add computed status based on business logic
      const sessionsWithStatus: SessionWithStatus[] = sessionsData.map(session => {
        const now = Math.floor(Date.now() / 1000); // Current time in Unix timestamp
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

        return {
          ...session,
          computedStatus
        };
      });

      setSessions(sessionsWithStatus);
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSessions = sessions.filter(session =>
    filter === 'all' || session.computedStatus === filter
  );

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

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const uploadPrescriptionToIPFS = async (sessionId: number) => {
    const data = prescriptionData[sessionId];

    if (!data || !data.patientIssues || !data.diagnosis || !data.treatment || !data.prescription) {
      alert('Please fill in all prescription fields');
      return null;
    }

    try {
      setUploadingPrescription({ ...uploadingPrescription, [sessionId]: true });

      // Create JSON object with prescription data
      const prescriptionJSON = {
        sessionId,
        patientIssues: data.patientIssues,
        diagnosis: data.diagnosis,
        treatment: data.treatment,
        prescription: data.prescription,
        timestamp: new Date().toISOString(),
        doctorAddress: address
      };

      // Convert to blob
      const blob = new Blob([JSON.stringify(prescriptionJSON, null, 2)], {
        type: 'application/json'
      });
      const file = new File([blob], `prescription-${sessionId}.json`, {
        type: 'application/json'
      });

      // Upload to IPFS via API
      const formData = new FormData();
      formData.set('file', file);

      const uploadRequest = await fetch('/api/files', {
        method: 'POST',
        body: formData,
      });

      const returnValue = await uploadRequest.json();
      const ipfsHash = returnValue[1];

      setPrescriptionIPFS({ ...prescriptionIPFS, [sessionId]: ipfsHash });
      setUploadingPrescription({ ...uploadingPrescription, [sessionId]: false });

      return ipfsHash;
    } catch (error) {
      console.error('Error uploading prescription:', error);
      setUploadingPrescription({ ...uploadingPrescription, [sessionId]: false });
      alert('Failed to upload prescription to IPFS');
      return null;
    }
  };

  const handleCompletSession = async (session: SessionWithStatus) => {
    // First upload prescription to IPFS if not already uploaded
    let ipfsHash = prescriptionIPFS[session.sessionId];

    if (!ipfsHash) {
      ipfsHash = await uploadPrescriptionToIPFS(session.sessionId);
      if (!ipfsHash) {
        return; // Upload failed
      }
    }

    try {
      await releasePayment({
        sessionId: session.sessionId,
        prescriptionIPFSHash: ipfsHash
      });

      alert('Session completed successfully! Payment released.');

      // Only clear form data after successful completion
      setShowPrescriptionForm({ ...showPrescriptionForm, [session.sessionId]: false });
      setPrescriptionData({
        ...prescriptionData, [session.sessionId]: {
          patientIssues: '',
          diagnosis: '',
          treatment: '',
          prescription: ''
        }
      });
      setPrescriptionIPFS({ ...prescriptionIPFS, [session.sessionId]: '' });

      fetchSessions(); // Refresh sessions
    } catch (error: any) {
      console.error('Error completing session:', error);
      alert(`Failed to complete blockchain transaction: ${error.message}. Your prescription is saved on IPFS. Click the button again to retry.`);
      // Don't clear anything - keep form and IPFS hash so they can retry
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
        title="My Appointments"
        subtitle="Manage patient appointments and consultations"
      >
        <div className="glass-card rounded-xl p-12 text-center border border-red-200">
          <h3 className="text-lg font-medium text-red-600 mb-2">Not Registered</h3>
          <p className="text-secondary mb-4">
            You need to register as a doctor and be approved to view appointments.
          </p>
        </div>
      </ResponsiveLayout>
    );
  }

  return (
    <ResponsiveLayout
      userType="doctor"
      title="My Sessions"
      subtitle="Manage patient consultation sessions"
    >
      {/* Statistics */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="glass-card rounded-xl p-4 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-primary">{sessions.length}</div>
                <div className="text-xs sm:text-sm text-secondary">Total Sessions</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border border-green-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">
                  {sessions.filter(s => s.computedStatus === 'completed').length}
                </div>
                <div className="text-xs sm:text-sm text-secondary">Completed</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border border-yellow-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {sessions.filter(s => s.computedStatus === 'pending').length}
                </div>
                <div className="text-xs sm:text-sm text-secondary">Pending</div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl p-4 border border-purple-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
              </div>
              <div>
                <div className="text-xl sm:text-2xl font-bold text-purple-600">
                  {sessions.filter(s => s.computedStatus === 'confirmed').length}
                </div>
                <div className="text-xs sm:text-sm text-secondary">Upcoming</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200 mb-6">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="w-5 h-5 text-blue-600" />
          <h2 className="text-base sm:text-lg font-semibold text-primary">Filter Sessions</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Sessions' },
            { key: 'confirmed', label: 'Upcoming' },
            { key: 'pending', label: 'Awaiting Completion' },
            { key: 'completed', label: 'Completed' }
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

      {/* Sessions List */}
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
      ) : filteredSessions.length > 0 ? (
        <div className="space-y-4">
          {filteredSessions.map((session) => (
            <div
              key={session.sessionId}
              className="glass-card rounded-xl p-6 hover:shadow-xl transition-all duration-300 border border-blue-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  {/* Patient Avatar */}
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-500 to-blue-600 flex items-center justify-center text-white font-semibold text-lg">
                    {session.patient.slice(2, 4).toUpperCase()}
                  </div>

                  {/* Session Details */}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-lg font-semibold text-primary">
                        Session #{session.sessionId}
                      </h3>
                      <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(session.computedStatus)}`}>
                        {session.computedStatus.charAt(0).toUpperCase() + session.computedStatus.slice(1)}
                      </span>
                    </div>

                    <p className="text-sm text-secondary mb-3">
                      Patient: <span className="font-mono">{session.patient.slice(0, 6)}...{session.patient.slice(-4)}</span>
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <div className="flex items-center text-sm text-secondary mb-1">
                          <Calendar className="w-4 h-4 mr-2" />
                          Scheduled Time
                        </div>
                        <div className="font-medium text-primary">
                          {formatDate(session.startTime)}
                        </div>
                        <div className="text-sm text-secondary">
                          {formatTime(session.startTime)}
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
                          {session.pyusdAmount} PYUSD
                        </div>
                        <div className="text-sm text-secondary">
                          {session.status === 'completed' ? 'Released' : 'In Escrow'}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-center text-sm text-secondary mb-1">
                          <FileText className="w-4 h-4 mr-2" />
                          Prescription
                        </div>
                        <div className="font-medium text-primary">
                          {session.prescriptionIPFSHash ? 'Uploaded' : 'Not Yet'}
                        </div>
                        {session.prescriptionIPFSHash && (
                          <a
                            href={`${session.prescriptionIPFSHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            View on IPFS
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Complete Session for Pending */}
                    {session.computedStatus === 'pending' && (
                      <div className="mt-4 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 mb-3">
                          <strong>Action Required:</strong> Session time has passed. Fill prescription details to complete and release payment.
                        </p>

                        {/* Show button to open form if not shown yet */}
                        {!showPrescriptionForm[session.sessionId] && !prescriptionIPFS[session.sessionId] && (
                          <button
                            onClick={() => setShowPrescriptionForm({ ...showPrescriptionForm, [session.sessionId]: true })}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
                          >
                            Fill Prescription Form
                          </button>
                        )}

                        {/* Prescription Form */}
                        {showPrescriptionForm[session.sessionId] && !prescriptionIPFS[session.sessionId] && (
                          <div className="space-y-3">
                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1">
                                Patient Issues
                              </label>
                              <textarea
                                value={prescriptionData[session.sessionId]?.patientIssues || ''}
                                onChange={(e) => setPrescriptionData({
                                  ...prescriptionData,
                                  [session.sessionId]: {
                                    ...prescriptionData[session.sessionId],
                                    patientIssues: e.target.value,
                                    diagnosis: prescriptionData[session.sessionId]?.diagnosis || '',
                                    treatment: prescriptionData[session.sessionId]?.treatment || '',
                                    prescription: prescriptionData[session.sessionId]?.prescription || ''
                                  }
                                })}
                                placeholder="Describe the patient's reported symptoms and concerns..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1">
                                Diagnosis
                              </label>
                              <textarea
                                value={prescriptionData[session.sessionId]?.diagnosis || ''}
                                onChange={(e) => setPrescriptionData({
                                  ...prescriptionData,
                                  [session.sessionId]: {
                                    ...prescriptionData[session.sessionId],
                                    patientIssues: prescriptionData[session.sessionId]?.patientIssues || '',
                                    diagnosis: e.target.value,
                                    treatment: prescriptionData[session.sessionId]?.treatment || '',
                                    prescription: prescriptionData[session.sessionId]?.prescription || ''
                                  }
                                })}
                                placeholder="Your medical diagnosis based on examination..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1">
                                Treatment Plan
                              </label>
                              <textarea
                                value={prescriptionData[session.sessionId]?.treatment || ''}
                                onChange={(e) => setPrescriptionData({
                                  ...prescriptionData,
                                  [session.sessionId]: {
                                    ...prescriptionData[session.sessionId],
                                    patientIssues: prescriptionData[session.sessionId]?.patientIssues || '',
                                    diagnosis: prescriptionData[session.sessionId]?.diagnosis || '',
                                    treatment: e.target.value,
                                    prescription: prescriptionData[session.sessionId]?.prescription || ''
                                  }
                                })}
                                placeholder="Recommended treatment approach and care instructions..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={2}
                              />
                            </div>

                            <div>
                              <label className="block text-sm font-semibold text-primary mb-1">
                                Medicinal Prescription
                              </label>
                              <textarea
                                value={prescriptionData[session.sessionId]?.prescription || ''}
                                onChange={(e) => setPrescriptionData({
                                  ...prescriptionData,
                                  [session.sessionId]: {
                                    ...prescriptionData[session.sessionId],
                                    patientIssues: prescriptionData[session.sessionId]?.patientIssues || '',
                                    diagnosis: prescriptionData[session.sessionId]?.diagnosis || '',
                                    treatment: prescriptionData[session.sessionId]?.treatment || '',
                                    prescription: e.target.value
                                  }
                                })}
                                placeholder="List of prescribed medications with dosage and instructions..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                                rows={3}
                              />
                            </div>

                            <div className="flex gap-2">
                              <button
                                onClick={() => setShowPrescriptionForm({ ...showPrescriptionForm, [session.sessionId]: false })}
                                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-400 transition-colors"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={() => handleCompletSession(session)}
                                disabled={isReleasingPayment || uploadingPrescription[session.sessionId]}
                                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                              >
                                {uploadingPrescription[session.sessionId] ? (
                                  <>
                                    <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Uploading to IPFS...
                                  </>
                                ) : isReleasingPayment ? (
                                  'Processing Transaction...'
                                ) : prescriptionIPFS[session.sessionId] ? (
                                  'Complete Session & Release Payment'
                                ) : (
                                  'Upload & Complete Session'
                                )}
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Show success message after upload */}
                        {prescriptionIPFS[session.sessionId] && !showPrescriptionForm[session.sessionId] && (
                          <div className="space-y-3">
                            <div className="flex items-start p-3 bg-green-50 rounded-lg border border-green-200">
                              <svg className="w-5 h-5 text-green-600 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <div className="flex-1">
                                <p className="text-sm font-semibold text-green-800 mb-1">Prescription uploaded to IPFS!</p>
                                <p className="text-xs text-green-700 mb-2">
                                  IPFS Hash: <span className="font-mono bg-white px-2 py-1 rounded">{prescriptionIPFS[session.sessionId]}</span>
                                </p>
                                <a
                                  href={`${prescriptionIPFS[session.sessionId]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                                >
                                  View prescription on IPFS →
                                </a>
                              </div>
                            </div>
                            <button
                              onClick={() => handleCompletSession(session)}
                              disabled={isReleasingPayment}
                              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                            >
                              {isReleasingPayment ? (
                                <>
                                  <svg className="animate-spin h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                  </svg>
                                  Processing Transaction...
                                </>
                              ) : (
                                'Complete Session & Release Payment'
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Upcoming Session Info */}
                    {session.computedStatus === 'confirmed' && (
                      <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <p className="text-sm text-blue-800">
                          <strong>Upcoming:</strong> Session scheduled for {formatDate(session.startTime)} at {formatTime(session.startTime)}
                        </p>
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
            <Calendar className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-primary mb-2">No sessions found</h3>
          <p className="text-secondary mb-4">
            {filter === 'all'
              ? "You don't have any consultation sessions yet."
              : `No ${filter} sessions found.`}
          </p>
        </div>
      )
      }
    </ResponsiveLayout >
  );
}
