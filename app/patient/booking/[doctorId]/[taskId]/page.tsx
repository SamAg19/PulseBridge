'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import { DoctorProfile, Task, TimeSlot } from '@/lib/types';
import { getDoctorProfile, getTaskById, createAppointment, getPatientProfile } from '@/lib/firebase/firestore';
import BookingSteps from '@/components/booking/BookingSteps';
import TimeSlotSelector from '@/components/booking/TimeSlotSelector';
import AppointmentSummary from '@/components/booking/AppointmentSummary';

export default function BookingPage() {
  const params = useParams();
  const router = useRouter();
  const { address } = useAccount();
  
  const [doctor, setDoctor] = useState<any>(null);
  const [task, setTask] = useState<any>(null);
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [currentStep, setCurrentStep] = useState<'select' | 'confirm' | 'success'>('select');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [appointmentId, setAppointmentId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadBookingData = async () => {
      try {
        setIsLoading(true);
        const doctorId = params.doctorId as string;
        const taskId = params.taskId as string;

        const [doctorData, taskData] = await Promise.all([
          getDoctorProfile(doctorId),
          getTaskById(taskId)
        ]);

        if (!doctorData) {
          setError('Doctor not found');
          return;
        }

        if (!taskData) {
          setError('Service not found');
          return;
        }

        setDoctor(doctorData as any);
        setTask(taskData as any);
      } catch (err) {
        console.error('Error loading booking data:', err);
        setError('Failed to load booking information');
      } finally {
        setIsLoading(false);
      }
    };

    loadBookingData();
  }, [params.doctorId, params.taskId]);

  const handleSlotSelect = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setCurrentStep('confirm');
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot || !address || !doctor || !task) return;

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
        // Redirect to payments page to complete payment
        router.push('/patient/payments');
      } else {
        setError('Failed to create appointment');
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
      setError('Failed to create appointment. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };



  const handleBackStep = () => {
    if (currentStep === 'confirm') {
      setCurrentStep('select');
    }
  };

  const handleStartOver = () => {
    setSelectedSlot(null);
    setCurrentStep('select');
    setAppointmentId(null);
    setError(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading booking information...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Booking Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.back()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  if (!doctor || !task) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.back()}
            className="flex items-center text-blue-600 hover:text-blue-700 mb-4 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Services
          </button>
          
          <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Appointment</h1>
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                  <span className="text-blue-600 font-semibold text-lg">
                    {doctor.fullName.split(' ').map((n: string) => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Dr. {doctor.fullName}</h2>
                  <p className="text-gray-600 text-sm">{doctor.specialization}</p>
                </div>
              </div>
              <div className="sm:ml-auto">
                <div className="bg-blue-50 rounded-lg px-3 py-2">
                  <p className="text-sm text-gray-600">Service</p>
                  <p className="font-semibold text-gray-900">{task.title}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <BookingSteps currentStep={currentStep} />
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
              {currentStep === 'select' && (
                <TimeSlotSelector
                  task={task}
                  onSlotSelect={handleSlotSelect}
                />
              )}

              {currentStep === 'confirm' && selectedSlot && (
                <AppointmentSummary
                  doctor={doctor}
                  task={task}
                  selectedSlot={selectedSlot}
                  onBack={handleBackStep}
                  onConfirm={handleConfirmBooking}
                  isProcessing={isProcessing}
                />
              )}

              {currentStep === 'success' && (
                <div className="p-8 text-center">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">Booking Confirmed!</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Your appointment has been successfully booked and paid for. You will receive a meeting link shortly.
                  </p>
                  <div className="bg-blue-50 rounded-xl p-6 mb-6 text-left">
                    <h4 className="font-semibold text-blue-900 mb-3">Next Steps:</h4>
                    <ul className="space-y-2 text-blue-800">
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Admin will provide a meeting link for your appointment
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        Meeting attendance will be tracked to verify both participants
                      </li>
                      <li className="flex items-start">
                        <span className="w-2 h-2 bg-blue-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                        You can leave a review after the consultation
                      </li>
                    </ul>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <button
                      onClick={() => router.push('/patient/appointments')}
                      className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      View My Appointments
                    </button>
                    <button
                      onClick={handleStartOver}
                      className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                    >
                      Book Another Appointment
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/70 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 sticky top-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Booking Summary</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Doctor:</span>
                  <span className="font-medium text-right">Dr. {doctor.fullName}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Service:</span>
                  <span className="font-medium text-right">{task.title}</span>
                </div>
                
                <div className="flex justify-between items-start">
                  <span className="text-gray-600">Duration:</span>
                  <span className="font-medium">{task.duration} minutes</span>
                </div>

                {selectedSlot && (
                  <>
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Date:</span>
                      <span className="font-medium text-right">
                        {new Date(selectedSlot.date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-start">
                      <span className="text-gray-600">Time:</span>
                      <span className="font-medium">
                        {new Date(`2000-01-01T${selectedSlot.startTime}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })} - {new Date(`2000-01-01T${selectedSlot.endTime}`).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit',
                          hour12: true 
                        })}
                      </span>
                    </div>
                  </>
                )}
                
                <div className="border-t pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-gray-900">Total:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {task.fee >= 1 ? `${task.fee} ETH` : `${(task.fee * 1000).toFixed(0)} mETH`}
                    </span>
                  </div>
                </div>
              </div>

              {currentStep === 'select' && (
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Select a time slot to continue with your booking
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}