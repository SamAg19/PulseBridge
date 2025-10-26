'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount, useChainId } from 'wagmi';
import Link from 'next/link';
import { TimeSlot } from '@/lib/types';
import { setDoctorAvailability, getDoctorAvailability } from '@/lib/firebase/availability';
import { useGetDoctorID } from '@/lib/contracts/hooks';

const durations = [15, 30, 45, 60, 90, 120];

export default function CreateTaskPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const { doctorId, isLoading: loadingDoctorId } = useGetDoctorID(address);

  // Calculate preview of slots count
  const calculatePreviewSlotsCount = () => {
    if (!currentSlot.startTime || !currentSlot.endTime) return 0;

    const startDateTime = new Date(`2000-01-01T${currentSlot.startTime}:00`);
    const endDateTime = new Date(`2000-01-01T${currentSlot.endTime}:00`);

    if (endDateTime <= startDateTime) return 0;

    const totalMinutes = (endDateTime.getTime() - startDateTime.getTime()) / 60000;
    return Math.floor(totalMinutes / duration);
  };

  const previewSlotsCount = calculatePreviewSlotsCount();

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const generateTimeSlots = () => {
    if (!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime) {
      return;
    }

    // Parse start and end times
    const startDateTime = new Date(`2000-01-01T${currentSlot.startTime}:00`);
    const endDateTime = new Date(`2000-01-01T${currentSlot.endTime}:00`);

    // Validate that end time is after start time
    if (endDateTime <= startDateTime) {
      setError('End time must be after start time');
      return;
    }

    // Generate slots
    const newSlots: TimeSlot[] = [];
    let currentTime = new Date(startDateTime);

    while (currentTime < endDateTime) {
      const slotEndTime = new Date(currentTime.getTime() + duration * 60000);

      // Only add slot if it doesn't exceed the end time
      if (slotEndTime <= endDateTime) {
        newSlots.push({
          date: currentSlot.date,
          startTime: currentTime.toTimeString().slice(0, 5),
          endTime: slotEndTime.toTimeString().slice(0, 5)
        });
      }

      currentTime = slotEndTime;
    }

    if (newSlots.length === 0) {
      setError('Time range is too short for the selected duration');
      return;
    }

    setSlots([...slots, ...newSlots]);
    setCurrentSlot({ date: '', startTime: '', endTime: '' });
    setError('');
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!address || !doctorId || slots.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      console.log('Saving availability for doctor ID:', doctorId);
      console.log('Wallet address:', address);
      console.log('New slots to add:', slots.length);

      // Get existing availability
      const existingAvailability = await getDoctorAvailability(address);
      console.log('Existing availability:', existingAvailability);

      // Merge new slots with existing ones
      const existingSlots = existingAvailability?.timeSlots || [];
      console.log('Existing slots count:', existingSlots.length);

      const allSlots = [...existingSlots, ...slots];
      console.log('Total slots after merge:', allSlots.length);

      // Save to Firebase availability collection
      await setDoctorAvailability(doctorId, address, allSlots);
      console.log('Successfully saved to Firebase');

      alert(`Successfully added ${slots.length} time slot${slots.length > 1 ? 's' : ''}!`);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
      console.error('Error saving availability:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <nav className="glass-card border-b border-blue-200">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center text-blue-600 hover:text-blue-800 transition-colors font-medium">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <div className="text-sm text-secondary">
            Publish Availability
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-3xl font-bold text-primary mb-2">Publish Your Availability</h1>
            <p className="text-secondary">Set your available time slots. Patients will be able to view and book these slots for consultations.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl animate-fadeInUp">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <div className="glass-card rounded-2xl p-8 animate-fadeInUp">
            <div className="space-y-8">
              {/* Duration Selection */}
              <div>
                <label className="block text-sm font-semibold text-primary mb-4">
                  Consultation Duration
                </label>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                  {durations.map((dur) => (
                    <button
                      key={dur}
                      type="button"
                      onClick={() => setDuration(dur)}
                      className={`p-4 rounded-xl font-medium transition-all duration-300 ${duration === dur
                          ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                          : 'bg-white border border-blue-200 text-primary hover:border-blue-300'
                        }`}
                    >
                      {dur}min
                    </button>
                  ))}
                </div>
                <p className="mt-2 text-sm text-secondary">
                  Select the duration for each consultation slot. We'll automatically create multiple slots based on your time range.
                </p>
              </div>

              {/* Time Slot Addition */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Generate Consultation Time Slots</h3>
                <p className="text-sm text-secondary mb-4">
                  Select a date and time range. We'll automatically create {duration}-minute time slots for you.
                </p>
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Date</label>
                    <input
                      type="date"
                      value={currentSlot.date}
                      onChange={(e) => setCurrentSlot({ ...currentSlot, date: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min={new Date().toISOString().split('T')[0]}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">Start Time</label>
                    <input
                      type="time"
                      value={currentSlot.startTime}
                      onChange={(e) => setCurrentSlot({ ...currentSlot, startTime: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="900"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-primary mb-2">End Time</label>
                    <input
                      type="time"
                      value={currentSlot.endTime}
                      onChange={(e) => setCurrentSlot({ ...currentSlot, endTime: e.target.value })}
                      className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                      step="900"
                    />
                  </div>
                </div>

                {/* Preview of slots to be generated */}
                {previewSlotsCount > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-800">
                      <strong>{previewSlotsCount}</strong> time slot{previewSlotsCount > 1 ? 's' : ''} will be generated ({duration} minutes each)
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  onClick={generateTimeSlots}
                  disabled={!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime}
                  className="mb-6 px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Generate {previewSlotsCount > 0 ? previewSlotsCount : ''} Time Slot{previewSlotsCount !== 1 ? 's' : ''}
                </button>

                {slots.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Time Slots to Publish ({slots.length})</h4>
                    {slots.map((slot, index) => (
                      <div key={index} className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200">
                        <div className="flex items-center space-x-4">
                          <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                          <span className="font-medium text-primary">
                            {new Date(slot.date).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                          <span className="text-secondary">
                            {slot.startTime} - {slot.endTime}
                          </span>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {duration}min
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeSlot(index)}
                          className="text-red-600 hover:text-red-700 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {slots.length === 0 && (
                  <div className="text-center py-8 text-secondary">
                    <svg className="w-12 h-12 mx-auto mb-3 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p>No time slots generated yet. Select a date and time range to continue.</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {slots.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">Summary</h3>
                  <p className="text-sm text-green-700">
                    You're publishing <strong>{slots.length}</strong> time slot{slots.length > 1 ? 's' : ''},
                    each lasting <strong>{duration} minutes</strong>.
                    These slots will be visible to patients and they can book them for consultations.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={slots.length === 0 || submitting || loadingDoctorId || !doctorId}
                  className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving Availability...
                    </div>
                  ) : (
                    `Publish ${slots.length} Time Slot${slots.length > 1 ? 's' : ''}`
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}