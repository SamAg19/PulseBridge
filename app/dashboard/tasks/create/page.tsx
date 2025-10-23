'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { createTask } from '@/lib/firebase/firestore';
import { TimeSlot } from '@/lib/types';

const categories = [
  {
    id: 'consultation',
    name: 'Consultation',
    icon: '🩺',
    description: 'General medical consultation and diagnosis',
    color: 'from-blue-500 to-blue-600'
  },
  {
    id: 'procedure',
    name: 'Procedure',
    icon: '⚕️',
    description: 'Medical procedures and treatments',
    color: 'from-purple-500 to-purple-600'
  },
  {
    id: 'followup',
    name: 'Follow-up',
    icon: '📋',
    description: 'Follow-up appointments and check-ups',
    color: 'from-green-500 to-green-600'
  }
];

const durations = [15, 30, 45, 60, 90, 120];

export default function CreateTaskPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'consultation' as const,
    duration: 30,
    fee: 0,
  });
  const [slots, setSlots] = useState<TimeSlot[]>([]);
  const [currentSlot, setCurrentSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isConnected) {
    router.push('/');
    return null;
  }

  const nextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const addSlot = () => {
    if (currentSlot.date && currentSlot.startTime && currentSlot.endTime) {
      setSlots([...slots, currentSlot]);
      setCurrentSlot({ date: '', startTime: '', endTime: '' });
    }
  };

  const removeSlot = (index: number) => {
    setSlots(slots.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!address) return;

    setSubmitting(true);
    setError('');

    try {
      await createTask({
        ...formData,
        doctorId: address,
        dateTimeSlots: slots,
        currency: 'PYUSD',
        status: 'draft',
      });
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
            Step {step} of 3
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex items-center justify-center mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                    }`}>
                    {i}
                  </div>
                  {i < 3 && (
                    <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${i < step ? 'bg-blue-600' : 'bg-gray-200'
                      }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="text-center">
              <h1 className="text-3xl font-bold text-primary mb-2">
                {step === 1 && 'Service Details'}
                {step === 2 && 'Pricing & Duration'}
                {step === 3 && 'Availability'}
              </h1>
              <p className="text-secondary">
                {step === 1 && 'Tell us about the medical service you want to offer'}
                {step === 2 && 'Set your pricing and appointment duration'}
                {step === 3 && 'Add your available time slots'}
              </p>
            </div>
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

          {/* Step 1: Service Details */}
          {step === 1 && (
            <div className="glass-card rounded-2xl p-8 animate-fadeInUp">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Service Title
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., General Health Consultation"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Service Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                    placeholder="Describe what this service includes, what patients can expect, and any special requirements..."
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-4">
                    Service Category
                  </label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {categories.map((category) => (
                      <div
                        key={category.id}
                        onClick={() => setFormData({ ...formData, category: category.id as any })}
                        className={`p-6 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${formData.category === category.id
                            ? 'bg-gradient-to-r ' + category.color + ' text-white shadow-lg'
                            : 'bg-white border border-blue-200 hover:border-blue-300'
                          }`}
                      >
                        <div className="text-3xl mb-3">{category.icon}</div>
                        <h3 className={`font-semibold mb-2 ${formData.category === category.id ? 'text-white' : 'text-primary'
                          }`}>
                          {category.name}
                        </h3>
                        <p className={`text-sm ${formData.category === category.id ? 'text-blue-100' : 'text-secondary'
                          }`}>
                          {category.description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end mt-8">
                <button
                  onClick={nextStep}
                  disabled={!formData.title || !formData.description}
                  className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Pricing & Duration */}
          {step === 2 && (
            <div className="glass-card rounded-2xl p-8 animate-fadeInUp">
              <div className="space-y-8">
                <div>
                  <label className="block text-sm font-semibold text-primary mb-4">
                    Appointment Duration
                  </label>
                  <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                    {durations.map((duration) => (
                      <button
                        key={duration}
                        type="button"
                        onClick={() => setFormData({ ...formData, duration })}
                        className={`p-4 rounded-xl font-medium transition-all duration-300 ${formData.duration === duration
                            ? 'bg-blue-600 text-white shadow-lg transform scale-105'
                            : 'bg-white border border-blue-200 text-primary hover:border-blue-300'
                          }`}
                      >
                        {duration}min
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-primary mb-3">
                    Service Fee (PYUSD)
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <span className="text-gray-500 text-lg">$</span>
                    </div>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.fee}
                      onChange={(e) => setFormData({ ...formData, fee: parseFloat(e.target.value) || 0 })}
                      className="w-full pl-8 pr-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg font-medium"
                      placeholder="0.00"
                      required
                    />
                  </div>
                  <p className="mt-2 text-sm text-secondary">
                    Set a competitive price for your {formData.duration}-minute {formData.category}
                  </p>
                </div>

                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                  <h3 className="font-semibold text-primary mb-3">Service Summary</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-secondary">Service:</span>
                      <span className="font-medium text-primary">{formData.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Category:</span>
                      <span className="font-medium text-primary capitalize">{formData.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Duration:</span>
                      <span className="font-medium text-primary">{formData.duration} minutes</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-secondary">Fee:</span>
                      <span className="font-medium text-primary">${formData.fee} PYUSD</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Back
                </button>
                <button
                  onClick={nextStep}
                  disabled={formData.fee <= 0}
                  className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Availability */}
          {step === 3 && (
            <div className="glass-card rounded-2xl p-8 animate-fadeInUp">
              <div className="space-y-8">
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4">Add Available Time Slots</h3>
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
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-primary mb-2">End Time</label>
                      <input
                        type="time"
                        value={currentSlot.endTime}
                        onChange={(e) => setCurrentSlot({ ...currentSlot, endTime: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-blue-200 rounded-xl input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={addSlot}
                    disabled={!currentSlot.date || !currentSlot.startTime || !currentSlot.endTime}
                    className="mb-6 px-6 py-3 bg-blue-100 text-blue-700 rounded-xl hover:bg-blue-200 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    + Add Time Slot
                  </button>

                  {slots.length > 0 && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-primary">Added Time Slots ({slots.length})</h4>
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
                      <p>No time slots added yet. Add at least one to continue.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-between mt-8">
                <button
                  onClick={prevStep}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                >
                  Back
                </button>
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
                      Creating Service...
                    </div>
                  ) : (
                    'Create Service'
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}