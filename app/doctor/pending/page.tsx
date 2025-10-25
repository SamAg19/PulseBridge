'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { checkDoctorRegistration } from '@/lib/firebase/auth';
import { DoctorProfile } from '@/lib/types';

export default function DoctorPendingPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState<(DoctorProfile & { id: string; walletAddress: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    const checkStatus = async () => {
      if (address) {
        try {
          const data = await checkDoctorRegistration(address);
          if (data) {
            setDoctorData(data);
            if (data.verificationStatus === 'approved') {
              router.push('/dashboard');
            }
          }
        } catch (error) {
          router.push('/doctor/register');
        }
      }
      setLoading(false);
    };

    checkStatus();
  }, [address, isConnected, router]);

  if (!isConnected || loading) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }


  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{animationDelay: '2s'}}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-100 rounded-full mb-6 shadow-lg">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-primary mb-4">
              Verification Pending
            </h1>
            <p className="text-xl text-secondary mb-6">
              Your registration is under review
            </p>
          </div>

          {doctorData && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left border border-blue-200">
              <h3 className="text-lg font-semibold text-primary mb-4">Submitted Information:</h3>
              <div className="space-y-2 text-secondary">
                <p><span className="font-medium text-primary">Name:</span> {doctorData.fullName}</p>
                <p><span className="font-medium text-primary">Email:</span> {doctorData.email}</p>
                <p><span className="font-medium text-primary">Specialization:</span> {doctorData.specialization}</p>
                <p><span className="font-medium text-primary">License:</span> {doctorData.licenseNumber}</p>
                <p><span className="font-medium text-primary">Wallet:</span> 
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded ml-2">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </p>
                <p><span className="font-medium text-primary">Status:</span> 
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${
                    doctorData.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    doctorData.verificationStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {doctorData.verificationStatus.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
              <h4 className="font-semibold mb-3 text-primary">What happens next?</h4>
              <ul className="text-sm space-y-2 text-left text-secondary">
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  Our team will verify your medical credentials
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  You'll receive an email notification once approved
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  Approved doctors can access the full dashboard
                </li>
                <li className="flex items-start">
                  <span className="text-blue-500 mr-2 mt-0.5">•</span>
                  Verification typically takes 24-48 hours
                </li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full btn-primary text-white font-semibold py-3 rounded-xl transition-all duration-300"
            >
              Refresh Status
            </button>

            <Link
              href="/"
              className="block text-blue-600 hover:text-blue-800 transition-colors font-medium"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}