'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { updateAppointmentPrescriptionVerification } from '@/lib/firebase/firestore';

interface PrescriptionVerificationProps {
  appointmentId: string;
  patientId: string;
  doctorName: string;
  prescriptionDelivered: boolean;
  prescriptionVerified: boolean;
  prescriptionVerificationTime?: any;
  onVerificationUpdate: () => void;
}

export default function PrescriptionVerification({
  appointmentId,
  patientId,
  doctorName,
  prescriptionDelivered,
  prescriptionVerified,
  prescriptionVerificationTime,
  onVerificationUpdate
}: PrescriptionVerificationProps) {
  const { address } = useAccount();
  const [isVerifying, setIsVerifying] = useState(false);

  const handleVerifyPrescription = async () => {
    if (!address || prescriptionVerified) return;

    try {
      setIsVerifying(true);
      
      const response = await fetch('/api/prescriptions/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          appointmentId,
          patientId: address,
          verified: true
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify prescription');
      }

      // Show success message with payment information
      if (data.paymentReleased) {
        alert('Prescription verified successfully! Your payment has been processed.');
      } else {
        alert('Prescription verified successfully!');
      }

      onVerificationUpdate();
    } catch (error) {
      console.error('Error verifying prescription:', error);
      alert('Failed to verify prescription. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = () => {
    if (prescriptionVerified) return 'text-green-600 bg-green-50 border-green-200';
    if (prescriptionDelivered) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-gray-600 bg-gray-50 border-gray-200';
  };

  const getStatusText = () => {
    if (prescriptionVerified) return 'Prescription Received & Verified';
    if (prescriptionDelivered) return 'Prescription Delivered - Awaiting Confirmation';
    return 'Prescription Not Yet Delivered';
  };

  const getStatusIcon = () => {
    if (prescriptionVerified) {
      return (
        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    if (prescriptionDelivered) {
      return (
        <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Prescription Delivery Status</h3>
          <p className="text-sm text-gray-600">From Dr. {doctorName}</p>
        </div>
        <div className="flex items-center space-x-2">
          {getStatusIcon()}
        </div>
      </div>

      {/* Status Card */}
      <div className={`border rounded-lg p-4 mb-4 ${getStatusColor()}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">{getStatusText()}</p>
            {prescriptionVerified && prescriptionVerificationTime && (
              <p className="text-sm mt-1">
                Verified on {formatDate(prescriptionVerificationTime)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Verification Instructions */}
      {prescriptionDelivered && !prescriptionVerified && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Prescription Delivery Confirmation</h4>
              <p className="text-sm text-blue-800 mb-3">
                Please confirm that you have received your prescription from the pharmacy or delivery service. 
                This confirmation will help release your payment portion from escrow.
              </p>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Verify all medications are included</li>
                <li>• Check dosages and instructions match the prescription</li>
                <li>• Confirm delivery is complete</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Verification Button */}
      {prescriptionDelivered && !prescriptionVerified && address === patientId && (
        <div className="flex justify-end">
          <button
            onClick={handleVerifyPrescription}
            disabled={isVerifying}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isVerifying ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Verifying...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span>Confirm Prescription Received</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Already Verified Message */}
      {prescriptionVerified && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-green-900">Prescription Delivery Confirmed</p>
              <p className="text-sm text-green-800">
                Thank you for confirming receipt of your prescription. Your payment has been processed accordingly.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Not Delivered Yet */}
      {!prescriptionDelivered && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Awaiting Prescription Delivery</p>
              <p className="text-sm text-gray-700">
                Your prescription is being prepared. You will be notified when it's ready for pickup or delivery.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}