'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { registerDoctor } from '@/lib/firebase/auth';

export default function SignUpPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    specialization: '',
    licenseNumber: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { password, ...doctorData } = formData;
      await registerDoctor(formData.email, password, doctorData);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const nextStep = () => {
    if (step === 1 && formData.fullName && formData.email) {
      setStep(2);
    }
  };

  const prevStep = () => {
    setStep(1);
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className="min-h-screen medical-gradient py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-5 rounded-full animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/4 right-1/4 w-32 h-32 bg-white opacity-5 rounded-full animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-30 rounded-full mb-6 backdrop-blur-sm shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Join Our Platform</h1>
          <p className="text-xl text-white font-medium drop-shadow-md">Create your doctor account in just a few steps</p>
        </div>

        {/* Progress indicator */}
        <div className="flex justify-center mb-8 animate-slideInRight">
          <div className="flex items-center space-x-4">
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step >= 1 ? 'bg-white text-blue-600 border-white' : 'border-white border-opacity-50 text-white'}`}>
              1
            </div>
            <div className={`w-16 h-1 rounded transition-all duration-300 ${step >= 2 ? 'bg-white' : 'bg-white bg-opacity-30'}`}></div>
            <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${step >= 2 ? 'bg-white text-blue-600 border-white' : 'border-white border-opacity-50 text-white'}`}>
              2
            </div>
          </div>
        </div>

        {/* Main form card */}
        <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-slideInRight">
          {error && (
            <div className="mb-6 p-4 bg-red-500 bg-opacity-20 border border-red-300 border-opacity-30 text-red-100 rounded-xl text-sm backdrop-blur-sm animate-fadeInUp">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                {error}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {step === 1 && (
              <div className="space-y-6 animate-fadeInUp">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Personal Information</h3>
                  <p className="text-blue-100 text-sm">Let's start with your basic details</p>
                </div>

                <div>
                  <label htmlFor="fullName" className="block text-sm font-semibold text-white mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="fullName"
                      type="text"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      placeholder="Dr. John Smith"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      placeholder="doctor@example.com"
                      required
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={nextStep}
                  className="w-full bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-4 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                >
                  Continue
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6 animate-fadeInUp">
                <div className="text-center mb-6">
                  <h3 className="text-xl font-semibold text-white mb-2">Professional Details</h3>
                  <p className="text-blue-100 text-sm">Complete your professional information</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="specialization" className="block text-sm font-semibold text-white mb-2">
                      Specialization
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                        </svg>
                      </div>
                      <input
                        id="specialization"
                        type="text"
                        value={formData.specialization}
                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                        className="w-full pl-10 pr-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                        placeholder="Cardiology"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="licenseNumber" className="block text-sm font-semibold text-white mb-2">
                      License Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-gray-800" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <input
                        id="licenseNumber"
                        type="text"
                        value={formData.licenseNumber}
                        onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                        className="w-full pl-10 pr-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                        placeholder="MD123456"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-white mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-100" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full pl-10 pr-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-100 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                      placeholder="••••••••"
                      required
                      minLength={6}
                    />
                  </div>
                  <p className="mt-2 text-blue-100 text-sm">Minimum 6 characters</p>
                </div>

                <div className="flex space-x-4">
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 bg-white bg-opacity-10 hover:bg-opacity-20 text-white font-semibold py-4 rounded-xl transition-all duration-300 backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-white bg-opacity-20 hover:bg-opacity-30 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed backdrop-blur-sm border border-white border-opacity-30 hover:border-opacity-50 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Creating...
                      </div>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>

          <div className="mt-8 text-center">
            <p className="text-blue-100">
              Already have an account?{' '}
              <Link href="/auth/signin" className="text-white font-semibold hover:text-blue-200 transition-colors duration-300 underline decoration-2 underline-offset-4">
                Sign in here
              </Link>
            </p>
          </div>
        </div>

        {/* Additional info */}
        <div className="text-center mt-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
          <p className="text-blue-100 text-sm">
            🔒 Your information is secure and encrypted
          </p>
        </div>
      </div>
    </div>
  );
}
