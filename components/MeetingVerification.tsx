'use client';

import { useState, useEffect } from 'react';
import { updateMeetingVerification, getMeetingVerificationStatus } from '@/lib/firebase/firestore';
import { MeetingVerification as MeetingVerificationType } from '@/lib/types';

interface MeetingVerificationProps {
  appointmentId: string;
  userType: 'doctor' | 'patient';
  onVerificationUpdate?: (verification: MeetingVerificationType) => void;
}

export default function MeetingVerification({ 
  appointmentId, 
  userType, 
  onVerificationUpdate 
}: MeetingVerificationProps) {
  const [verification, setVerification] = useState<MeetingVerificationType>({
    doctorVerified: false,
    patientVerified: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVerificationStatus();
  }, [appointmentId]);

  const loadVerificationStatus = async () => {
    try {
      const status = await getMeetingVerificationStatus(appointmentId);
      setVerification(status);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleVerification = async (verified: boolean) => {
    setLoading(true);
    setError(null);

    try {
      const result = await updateMeetingVerification(appointmentId, userType, verified);
      
      // Update local state
      const updatedVerification = {
        ...verification,
        [`${userType}Verified`]: verified,
        [`${userType}VerificationTime`]: verified ? new Date() : undefined
      };
      
      setVerification(updatedVerification);
      onVerificationUpdate?.(updatedVerification);

      if (result.bothVerified) {
        // Both parties have verified - payment will be released
        console.log('Both parties verified - payment release initiated');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentUserVerified = userType === 'doctor' ? verification.doctorVerified : verification.patientVerified;
  const otherUserVerified = userType === 'doctor' ? verification.patientVerified : verification.doctorVerified;
  const bothVerified = verification.doctorVerified && verification.patientVerified;

  return (
    <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
      <h3 className="text-lg font-semibold text-white mb-4">Meeting Verification</h3>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-red-200 text-sm">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Current User Verification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              currentUserVerified ? 'bg-green-400' : 'bg-gray-400'
            }`} />
            <span className="text-white">
              Your verification ({userType})
            </span>
          </div>
          
          {!currentUserVerified ? (
            <button
              onClick={() => handleVerification(true)}
              disabled={loading}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 
                       text-white rounded-lg transition-colors duration-200 text-sm"
            >
              {loading ? 'Verifying...' : 'Verify Attendance'}
            </button>
          ) : (
            <div className="flex items-center space-x-2">
              <span className="text-green-400 text-sm">✓ Verified</span>
              <button
                onClick={() => handleVerification(false)}
                disabled={loading}
                className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 text-red-300 
                         rounded text-xs transition-colors duration-200"
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {/* Other User Verification Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${
              otherUserVerified ? 'bg-green-400' : 'bg-gray-400'
            }`} />
            <span className="text-white">
              {userType === 'doctor' ? 'Patient' : 'Doctor'} verification
            </span>
          </div>
          
          <span className={`text-sm ${
            otherUserVerified ? 'text-green-400' : 'text-gray-400'
          }`}>
            {otherUserVerified ? '✓ Verified' : 'Pending'}
          </span>
        </div>

        {/* Overall Status */}
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center justify-between">
            <span className="text-white font-medium">Meeting Status:</span>
            <span className={`px-3 py-1 rounded-full text-sm ${
              bothVerified 
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {bothVerified ? 'Completed & Verified' : 'Awaiting Verification'}
            </span>
          </div>
          
          {bothVerified && (
            <p className="text-green-300 text-sm mt-2">
              ✓ Payment has been released to the doctor
            </p>
          )}
        </div>

        {/* Verification Timestamps */}
        {(verification.doctorVerificationTime || verification.patientVerificationTime) && (
          <div className="pt-4 border-t border-white/10">
            <h4 className="text-white text-sm font-medium mb-2">Verification Timeline:</h4>
            <div className="space-y-1 text-xs text-gray-300">
              {verification.doctorVerificationTime && (
                <div>
                  Doctor verified: {new Date(verification.doctorVerificationTime.toDate()).toLocaleString()}
                </div>
              )}
              {verification.patientVerificationTime && (
                <div>
                  Patient verified: {new Date(verification.patientVerificationTime.toDate()).toLocaleString()}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}