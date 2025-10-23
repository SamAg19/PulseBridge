'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { checkDoctorRegistration } from '@/lib/firebase/auth';

export default function DoctorPendingPage() {
  const { address, isConnected } = useAccount();
  const router = useRouter();
  const [doctorData, setDoctorData] = useState<any>(null);
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
          } else {
            router.push('/doctor/register');
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
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-white opacity-10 rounded-full animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-white opacity-5 rounded-full animate-pulse-slow" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="glass-effect rounded-2xl p-8 shadow-2xl animate-slideInRight">
          <div className="mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-yellow-500 bg-opacity-30 rounded-full mb-6 backdrop-blur-sm shadow-lg">
              <svg className="w-10 h-10 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">
              Verification Pending
            </h1>
            <p className="text-xl text-blue-100 mb-6">
              Your registration is under review
            </p>
          </div>

          {doctorData && (
            <div className="bg-white bg-opacity-10 rounded-xl p-6 mb-8 text-left">
              <h3 className="text-lg font-semibold text-white mb-4">Submitted Information:</h3>
              <div className="space-y-2 text-blue-100">
                <p><span className="font-medium">Name:</span> {doctorData.fullName}</p>
                <p><span className="font-medium">Email:</span> {doctorData.email}</p>
                <p><span className="font-medium">Specialization:</span> {doctorData.specialization}</p>
                <p><span className="font-medium">License:</span> {doctorData.licenseNumber}</p>
                <p><span className="font-medium">Wallet:</span> {address?.slice(0, 6)}...{address?.slice(-4)}</p>
                <p><span className="font-medium">Status:</span> 
                  <span className={`ml-2 px-2 py-1 rounded text-sm ${
                    doctorData.verificationStatus === 'pending' ? 'bg-yellow-500 text-yellow-900' :
                    doctorData.verificationStatus === 'approved' ? 'bg-green-500 text-green-900' :
                    'bg-red-500 text-red-900'
                  }`}>
                    {doctorData.verificationStatus.toUpperCase()}
                  </span>
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div className="bg-blue-500 bg-opacity-20 rounded-xl p-4 text-blue-100">
              <h4 className="font-semibold mb-2">What happens next?</h4>
              <ul className="text-sm space-y-1 text-left">
                <li>• Our team will verify your medical credentials</li>
                <li>• You'll receive an email notification once approved</li>
                <li>• Approved doctors can access the full dashboard</li>
                <li>• Verification typically takes 24-48 hours</li>
              </ul>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              Refresh Status
            </button>

            <Link
              href="/"
              className="block text-blue-100 hover:text-white transition-colors"
            >
              ← Back to home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}