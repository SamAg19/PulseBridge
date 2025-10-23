'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { registerDoctorWithWallet, checkDoctorRegistration } from '@/lib/firebase/auth';

export default function DoctorRegisterPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [formData, setFormData] = useState({
    fullName: '',
    specialization: '',
    licenseNumber: '',
    email: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    // Check if doctor is already registered
    const checkRegistration = async () => {
      if (address) {
        try {
          const doctorData = await checkDoctorRegistration(address);
          if (doctorData) {
            if (doctorData.verificationStatus === 'approved') {
              router.push('/dashboard');
            } else {
              router.push('/doctor/pending');
            }
            return;
          }
        } catch (error) {
          // Doctor not registered, continue with registration
        }
      }
      setCheckingRegistration(false);
    };

    checkRegistration();
  }, [address, isConnected, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address) return;

    setError('');
    setLoading(true);

    try {
      await registerDoctorWithWallet(address, formData);
      router.push('/doctor/pending');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isConnected) {
    return null;
  }

  if (checkingRegistration) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center">
        <div className="text-white text-xl">Checking registration status...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient py-12 px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-5 rounded-full animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 animate-fadeInUp">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-white bg-opacity-30 rounded-full mb-6 backdrop-blur-sm shadow-lg">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h1 className="text-5xl font-bold text-white mb-3 drop-shadow-lg">Doctor Registration</h1>
          <p className="text-xl text-white font-medium drop-shadow-md">Complete your profile to get verified</p>
          <p className="text-blue-100 mt-2">Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}</p>
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

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fullName" className="block text-sm font-semibold text-white mb-2">
                  Full Name
                </label>
                <input
                  id="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  placeholder="Dr. John Smith"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-white mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  placeholder="doctor@example.com"
                  required
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="specialization" className="block text-sm font-semibold text-white mb-2">
                  Specialization
                </label>
                <input
                  id="specialization"
                  type="text"
                  value={formData.specialization}
                  onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                  className="w-full px-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  placeholder="Cardiology"
                  required
                />
              </div>

              <div>
                <label htmlFor="licenseNumber" className="block text-sm font-semibold text-white mb-2">
                  License Number
                </label>
                <input
                  id="licenseNumber"
                  type="text"
                  value={formData.licenseNumber}
                  onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                  className="w-full px-4 py-4 bg-white bg-opacity-20 border border-white border-opacity-30 rounded-xl text-white placeholder-gray-800 input-focus backdrop-blur-sm focus:bg-opacity-30 focus:border-opacity-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
                  placeholder="MD123456"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Registering...
                </div>
              ) : (
                'Submit for Verification'
              )}
            </button>
          </form>

          <div className="mt-8 text-center">
            <Link href="/" className="text-blue-100 hover:text-white transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>

        {/* Additional info */}
        <div className="text-center mt-6 animate-fadeInUp" style={{animationDelay: '0.3s'}}>
          <p className="text-blue-100 text-sm">
            🔒 Your information will be reviewed for verification
          </p>
        </div>
      </div>
    </div>
  );
}