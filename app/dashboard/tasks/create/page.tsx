'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { createTask } from '@/lib/firebase/firestore';
import { TimeSlot } from '@/lib/types';

const durations = [15, 30, 45, 60, 90, 120];

export default function CreateTaskPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [duration, setDuration] = useState(30);
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState({ date: '', startTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  if (!isConnected) {
    return null;
  }

  const addSlot = () => {
    if (currentSlot.date && currentSlot.startTime) {
      // Auto-calculate end time based on duration
      const startTime = new Date(`2000-01-01T${currentSlot.startTime}:00`);
      const endTime = new Date(startTime.getTime() + duration * 60000);
      const endTimeString = endTime.toTimeString().slice(0, 5);
      
      const newSlot = {
        ...currentSlot,
        endTime: endTimeString
      };
      
      setSlots([...slots, newSlot]);
      setCurrentSlot({ date: '', startTime: '' });
    }
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!address || slots.length === 0) return;

    setSubmitting(true);
    setError('');

    try {
      // Create individual consultation services for each time slot
      for (const slot of slots) {
        await createTask({
          title: 'Medical Consultation',
          description: 'Professional medical consultation and health assessment',
          category: 'consultation',
          duration: duration,
          fee: 0, // No payment processing
          doctorId: address,
          dateTimeSlots: [slot], // Each slot becomes a separate service
          currency: 'PYUSD',
          status: 'draft',
        });
      }
      router.push('/dashboard/tasks');
    } catch (err: any) {
      setError(err.message);
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
            Add Consultation Times
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
            <h1 className="text-3xl font-bold text-primary mb-2">Add Consultation Times</h1>
            <p className="text-secondary">Set your available consultation times. Each time slot will become a bookable consultation service.</p>
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
                  Select the duration for each consultation. End times will be calculated automatically.
                </p>
              </div>

              {/* Time Slot Addition */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4">Add Available Consultation Times</h3>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
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
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={addSlot}
                  disabled={!currentSlot.date || !currentSlot.startTime}
                  className="mb-6 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  + Add Consultation Time
                </button>

                {slots.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-primary">Available Consultation Times ({slots.length})</h4>
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
                    <p>No consultation times added yet. Add at least one to continue.</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              {slots.length > 0 && (
                <div className="bg-green-50 rounded-xl p-6 border border-green-200">
                  <h3 className="font-semibold text-green-800 mb-3">Summary</h3>
                  <p className="text-sm text-green-700">
                    You're creating <strong>{slots.length}</strong> consultation service{slots.length > 1 ? 's' : ''}, 
                    each lasting <strong>{duration} minutes</strong>. 
                    Patients will be able to book these specific time slots for consultations.
                  </p>
                </div>
              )}

              <div className="flex justify-end mt-8">
                <button
                  onClick={handleSubmit}
                  disabled={slots.length === 0 || submitting}
                  className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <div className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating Consultation Times...
                    </div>
                  ) : (
                    `Create ${slots.length} Consultation${slots.length > 1 ? 's' : ''}`
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