'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useChainId, useConfig, useAccount } from 'wagmi';
import Link from 'next/link';
import { readContract } from "@wagmi/core";
import { chains, DoctorRegistry } from "@/lib/constants";
import { formatUnits } from 'viem';

export default function DoctorPendingPage() {
  const chainId = useChainId();
  const DocRegistry = chains[chainId]["DoctorRegistry"];
  const config = useConfig();

  const { address, isConnected } = useAccount();
  const router = useRouter();

  const [doctorData, setDoctorData] = useState<any>(null);
  const [status, setStatus] = useState<'pending' | 'approved' | 'denied'>('pending');
  const [loading, setLoading] = useState(true);



  useEffect(() => {
    if (!isConnected) {
      router.push('/');
      return;
    }

    checkStatus();
  }, [address, isConnected, router]);

  async function checkStatus() {
    if (!address) return;

    try {
      // Get registration ID
      const registerId: any = await readContract(config, {
        abi: DoctorRegistry,
        address: DocRegistry as `0x${string}`,
        functionName: 'docToRegistrationID',
        args: [address],
      });

      // If no registration ID, redirect to register
      if (Number(registerId) === 0) {
        router.push('/doctor/register');
        return;
      }

      // Get registration status (0=PENDING, 1=APPROVED, 2=DENIED)
      const regStatus: any = await readContract(config, {
        abi: DoctorRegistry,
        address: DocRegistry as `0x${string}`,
        functionName: 'isRegisterIDApproved',
        args: [registerId],
      });

      const statusNumber = Number(regStatus);

      // If approved, redirect to dashboard
      if (statusNumber === 1) {
        router.push('/dashboard');
        return;
      }

      // If denied, could redirect to rejected page (or show message here)
      if (statusNumber === 2) {
        setStatus('denied');
        localStorage.removeItem('IPFS');
      }

      // Get pending doctor details
      const pendingDoctor: any = await readContract(config, {
        abi: DoctorRegistry,
        address: DocRegistry as `0x${string}`,
        functionName: 'getPendingDoctorInfoByID',
        args: [registerId],
      });

      // pendingDoctor[0] is the RegStruct, pendingDoctor[1] is status
      const doctorInfo = pendingDoctor[0];

      setDoctorData({
        registrationId: Number(doctorInfo.registrationId),
        fullName: doctorInfo.Name,
        email: doctorInfo.email,
        specialization: doctorInfo.specialization,
        profileDescription: doctorInfo.profileDescription,
        consultationFee: formatUnits(doctorInfo.consultationFeePerHour, 6),
        legalDocumentsIPFSHash: doctorInfo.legalDocumentsIPFSHash,
        walletAddress: doctorInfo.doctorAddress,
      });

      setStatus(statusNumber === 0 ? 'pending' : statusNumber === 1 ? 'approved' : 'denied');
    } catch (error) {
      console.error('Error checking status:', error);
      router.push('/doctor/register');
    } finally {
      setLoading(false);
    }
  }

  if (!isConnected || loading) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center">
        <div className="glass-card p-8 rounded-2xl">
          <div className="text-primary text-xl font-medium">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen medical-gradient flex items-center justify-center px-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto text-center">
        <div className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight">
          <div className="mb-8">
            <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full mb-6 shadow-lg ${status === 'pending' ? 'bg-yellow-100' :
              status === 'approved' ? 'bg-green-100' :
                'bg-red-100'
              }`}>
              {status === 'pending' && (
                <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === 'approved' && (
                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
              {status === 'denied' && (
                <svg className="w-10 h-10 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>

            <h1 className="text-4xl font-bold text-primary mb-4">
              {status === 'pending' && 'Verification Pending'}
              {status === 'approved' && 'Application Approved!'}
              {status === 'denied' && 'Application Denied'}
            </h1>

            <p className="text-xl text-secondary mb-6">
              {status === 'pending' && 'Your registration is under review'}
              {status === 'approved' && 'Welcome to PulseBridge!'}
              {status === 'denied' && 'Your application was not approved'}
            </p>
          </div>

          {doctorData && (
            <div className="bg-blue-50 rounded-xl p-6 mb-8 text-left border border-blue-200">
              <h3 className="text-lg font-semibold text-primary mb-4">Submitted Information:</h3>
              <div className="space-y-2 text-secondary">
                <p><span className="font-medium text-primary">Registration ID:</span> #{doctorData.registrationId}</p>
                <p><span className="font-medium text-primary">Name:</span> {doctorData.fullName}</p>
                <p><span className="font-medium text-primary">Email:</span> {doctorData.email}</p>
                <p><span className="font-medium text-primary">Specialization:</span> {doctorData.specialization}</p>
                <p><span className="font-medium text-primary">Consultation Fee:</span> {doctorData.consultationFee} PYUSD/hour</p>
                <p><span className="font-medium text-primary">Wallet:</span>
                  <span className="font-mono text-sm bg-white px-2 py-1 rounded ml-2">
                    {address?.slice(0, 6)}...{address?.slice(-4)}
                  </span>
                </p>
                <p><span className="font-medium text-primary">Status:</span>
                  <span className={`ml-2 px-3 py-1 rounded-full text-sm font-medium ${status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    status === 'approved' ? 'bg-green-100 text-green-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                    {status.toUpperCase()}
                  </span>
                </p>
                {doctorData.legalDocumentsIPFSHash && (
                  <p>
                    <span className="font-medium text-primary">Documents:</span>
                    <a
                      href={String(localStorage.getItem('IPFS'))}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 text-blue-600 hover:text-blue-800 underline text-sm"
                    >
                      View on IPFS
                    </a>
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="space-y-4">
            {status === 'pending' && (
              <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                <h4 className="font-semibold mb-3 text-primary">What happens next?</h4>
                <ul className="text-sm space-y-2 text-left text-secondary">
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    Our team will verify your medical credentials
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    You'll see your status update on this page once reviewed
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    Approved doctors can access the full dashboard
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    Verification typically takes 24-48 hours
                  </li>
                  <li className="flex items-start">
                    <span className="text-blue-500 mr-2 mt-0.5">•</span>
                    Your stake will be refunded (minus deposit fee) upon approval
                  </li>
                </ul>
              </div>
            )}

            {status === 'denied' && (
              <div className="bg-red-50 rounded-xl p-6 border border-red-200">
                <p className="text-sm text-red-800">
                  Unfortunately, your application was not approved. Please check your credentials and try registering again.
                </p>
              </div>
            )}

            <button
              onClick={() => checkStatus()}
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
