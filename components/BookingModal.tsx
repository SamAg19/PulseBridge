'use client';

import { useState, useEffect, Key } from 'react';
import { useAccount } from 'wagmi';
import { DoctorProfile, Task, TimeSlot } from '@/lib/types';
import { createAppointment, getPatientProfile } from '@/lib/firebase/firestore';

interface BookingModalProps {
  doctor: any;
  task: any;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ doctor, task, isOpen, onClose, onSuccess }: BookingModalProps) {
  const { address } = useAccount();
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'confirm' | 'payment' | 'success'>('select');
  const [appointmentId, setAppointmentId] = useState<string | null>(null);



  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatFee = (fee: number) => {
    return fee >= 1 ? `${fee} ETH` : `${(fee * 1000).toFixed(0)} mETH`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !address) return;

    try {
      setIsProcessing(true);
      
      // Get patient profile for email information
      const patientProfile = await getPatientProfile(address);
      
      // Create appointment in Firebase
      const appointmentData = {
        doctorId: doctor.id!,
        patientId: address,
        taskId: task.id!,
        scheduledDate: new Date(selectedSlot.date),
        scheduledTime: selectedSlot.startTime,
        status: 'pending' as const,
        paymentStatus: 'pending_approval' as const,
        paymentAmount: task.fee,
        patientEmail: patientProfile?.email || '',
        patientName: patientProfile?.fullName || '',
        patientPhone: patientProfile?.phoneNumber || '',
      };

      const result = await createAppointment(appointmentData);
      
      if (result.success) {
        setAppointmentId(result.appointmentId);
        setStep('payment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      alert('Failed to create appointment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePayment = async () => {
    try {
      // Bypass actual payment processing for now
      // Simulate successful payment
      setStep('success');
      
      // Optional: Update appointment status to confirmed
      // This would normally happen after successful payment
      console.log('Payment bypassed - appointment created successfully');
    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'select':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Select Time Slot</h3>
            <div className="space-y-4">
              {task.dateTimeSlots.map((slot: TimeSlot, index: Key | null | undefined) => (
                <div
                  key={index}
                  onClick={() => handleSlotSelect(slot)}
                  className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium text-gray-900">{formatDate(slot.date)}</div>
                      <div className="text-sm text-gray-600">
                        {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                      </div>
                    </div>
                    <div className="text-blue-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Booking</h3>
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium">Dr. {doctor.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium">{task.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{selectedSlot && formatDate(selectedSlot.date)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">
                    {selectedSlot && `${formatTime(selectedSlot.startTime)} - ${formatTime(selectedSlot.endTime)}`}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{task.duration} minutes</span>
                </div>
                <div className="border-t pt-3 flex justify-between">
                  <span className="text-gray-900 font-semibold">Total:</span>
                  <span className="text-xl font-bold text-blue-600">{formatFee(task.fee)}</span>
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setStep('select')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleConfirmBooking}
                disabled={isProcessing}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isProcessing ? 'Creating...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        );

      case 'payment':
        return (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complete Payment</h3>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <p className="text-gray-600 mb-4">
                Your appointment has been created. Click "Complete Booking" to confirm your appointment.
              </p>
              <div className="text-2xl font-bold text-blue-600 mb-2">{formatFee(task.fee)}</div>
              <div className="text-sm text-gray-500 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                💡 Payment processing is currently bypassed for testing
              </div>
            </div>



            <button
              onClick={handlePayment}
              className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Complete Booking
            </button>
          </div>
        );

      case 'success':
        return (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Booking Confirmed!</h3>
            <p className="text-gray-600 mb-4">
              Your appointment has been successfully booked and paid for. You will receive a meeting link shortly.
            </p>
            <div className="bg-blue-50 rounded-lg p-4 mb-4">
              <p className="text-sm text-blue-800">
                <strong>Next Steps:</strong><br />
                • Admin will provide a meeting link for your appointment<br />
                • Meeting attendance will be tracked to verify both participants<br />
                • You can leave a review after the consultation
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[60] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Progress Steps */}
          <div className="flex items-center mt-4 space-x-2">
            {['select', 'confirm', 'payment', 'success'].map((stepName, index) => (
              <div key={stepName} className="flex items-center">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName ? 'bg-blue-600 text-white' :
                  ['select', 'confirm', 'payment', 'success'].indexOf(step) > index ? 'bg-green-600 text-white' :
                  'bg-gray-200 text-gray-600'
                }`}>
                  {['select', 'confirm', 'payment', 'success'].indexOf(step) > index ? (
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    index + 1
                  )}
                </div>
                {index < 3 && (
                  <div className={`w-8 h-0.5 ${
                    ['select', 'confirm', 'payment', 'success'].indexOf(step) > index ? 'bg-green-600' : 'bg-gray-200'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="p-6">
          {renderStepContent()}
        </div>
      </div>
    </div>
  );
}