'use client';

import { DoctorProfile, Task, TimeSlot } from '@/lib/types';

interface AppointmentSummaryProps {
  doctor: DoctorProfile;
  task: Task;
  selectedSlot: TimeSlot;
  onBack: () => void;
  onConfirm: () => void;
  isProcessing: boolean;
}

export default function AppointmentSummary({ 
  doctor, 
  task, 
  selectedSlot, 
  onBack, 
  onConfirm, 
  isProcessing 
}: AppointmentSummaryProps) {
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

  const formatFee = (fee: number) => {
    return fee >= 1 ? `${fee} ETH` : `${(fee * 1000).toFixed(0)} mETH`;
  };

  const getTimeOfDay = (timeStr: string) => {
    const [hours] = timeStr.split(':');
    const hour = parseInt(hours);
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  const timeOfDay = getTimeOfDay(selectedSlot.startTime);

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Confirm Your Appointment</h3>
        <p className="text-gray-600">
          Please review your appointment details before proceeding to payment
        </p>
      </div>

      {/* Appointment Details Card */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 border border-blue-100 mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Doctor Information */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Doctor Information
            </h4>
            
            <div className="bg-white rounded-xl p-6 border border-blue-100">
              <div className="flex items-center mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mr-4">
                  <span className="text-blue-600 font-bold text-xl">
                    {doctor.fullName.split(' ').map(n => n[0]).join('')}
                  </span>
                </div>
                <div>
                  <h5 className="text-xl font-bold text-gray-900">Dr. {doctor.fullName}</h5>
                  <p className="text-blue-600 font-medium">{doctor.specialization}</p>
                  {doctor.rating && (
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <svg
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(doctor.rating!) ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600 ml-2">
                        {doctor.rating.toFixed(1)} ({doctor.totalReviews} reviews)
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {doctor.bio && (
                <p className="text-gray-600 text-sm leading-relaxed">{doctor.bio}</p>
              )}
            </div>
          </div>

          {/* Appointment Details */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Appointment Details
            </h4>
            
            <div className="bg-white rounded-xl p-6 border border-blue-100 space-y-4">
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Service:</span>
                <span className="font-semibold text-gray-900 text-right">{task.title}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Date:</span>
                <span className="font-semibold text-gray-900 text-right">{formatDate(selectedSlot.date)}</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Time:</span>
                <div className="text-right">
                  <span className="font-semibold text-gray-900">
                    {formatTime(selectedSlot.startTime)} - {formatTime(selectedSlot.endTime)}
                  </span>
                  <div className="text-sm text-gray-500 capitalize">
                    {timeOfDay} appointment
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Duration:</span>
                <span className="font-semibold text-gray-900">{task.duration} minutes</span>
              </div>
              
              <div className="flex justify-between items-start">
                <span className="text-gray-600 font-medium">Category:</span>
                <span className="font-semibold text-gray-900 capitalize">{task.category}</span>
              </div>
              
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">Total Fee:</span>
                  <span className="text-2xl font-bold text-blue-600">{formatFee(task.fee)}</span>
                </div>
                <div className="text-right text-sm text-gray-500 mt-1">
                  ≈ ${(task.fee * 2500).toFixed(2)} USD
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Service Description */}
      {task.description && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 mb-8">
          <h4 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
            <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Service Description
          </h4>
          <p className="text-gray-600 leading-relaxed">{task.description}</p>
        </div>
      )}

      {/* Important Information */}
      <div className="bg-amber-50 rounded-xl p-6 border border-amber-200 mb-8">
        <h4 className="font-semibold text-amber-900 mb-3 flex items-center">
          <svg className="w-5 h-5 text-amber-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Important Information
        </h4>
        <div className="space-y-2 text-amber-800 text-sm">
          <div className="flex items-start">
            <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <p>Your payment will be held in escrow until the consultation is completed and verified by both parties</p>
          </div>
          <div className="flex items-start">
            <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <p>You will receive a meeting link via email before your scheduled appointment</p>
          </div>
          <div className="flex items-start">
            <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <p>Both you and the doctor must verify meeting attendance for payment to be processed</p>
          </div>
          <div className="flex items-start">
            <span className="w-2 h-2 bg-amber-600 rounded-full mt-2 mr-3 flex-shrink-0"></span>
            <p>You can reschedule or cancel your appointment up to 24 hours before the scheduled time</p>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4">
        <button
          onClick={onBack}
          className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 hover:border-gray-400 transition-all font-medium flex items-center justify-center"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Time Selection
        </button>
        
        <button
          onClick={onConfirm}
          disabled={isProcessing}
          className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isProcessing ? (
            <div className="flex items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Creating Appointment...
            </div>
          ) : (
            <div className="flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Proceed to Payment
            </div>
          )}
        </button>
      </div>
    </div>
  );
}