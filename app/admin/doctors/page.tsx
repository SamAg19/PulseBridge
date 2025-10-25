'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useReadContract } from 'wagmi';
import { useApproveDoctor, useDenyDoctor, useContractAddress } from '@/lib/contracts/hooks';
import { DoctorRegistry } from '@/lib/constants';
import { ConnectButton } from '@rainbow-me/rainbowkit';

interface DoctorData {
  registrationId: number;
  doctorId: number;
  name: string;
  specialization: string;
  profileDescription: string;
  email: string;
  walletAddress: string;
  consultationFeePerHour: number;
  legalDocumentsIPFSHash: string;
  status: 'pending' | 'approved' | 'denied';
}

export default function AdminDoctors() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const { approveDoctor, isPending: isApproving } = useApproveDoctor();
  const { denyDoctor, isPending: isDenying } = useDenyDoctor();

  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('all');
  const [updatingDoctor, setUpdatingDoctor] = useState<string | null>(null);
  const [error, setError] = useState<string>('');
  const [debugInfo, setDebugInfo] = useState<string[]>([]);

  // Get total number of registrations
  const { data: totalRegsData, isLoading: loadingTotal, refetch: refetchTotal } = useReadContract({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'numTotalRegistrations',
    query: {
      enabled: !!doctorRegistryAddress,
    },
  });

  const numTotalRegistrations = totalRegsData ? Number(totalRegsData) : 0;

  // Add debug message
  const addDebug = (msg: string) => {
    console.log(msg);
    setDebugInfo(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  useEffect(() => {
    if (isConnected && doctorRegistryAddress && totalRegsData !== undefined) {
      fetchAllDoctors();
    }
  }, [isConnected, doctorRegistryAddress, totalRegsData]);

  const fetchAllDoctors = async () => {
    try {
      setLoading(true);
      setError('');

      addDebug(`📊 Total registrations: ${numTotalRegistrations}`);

      if (numTotalRegistrations === 0) {
        addDebug('No registrations found');
        setDoctors([]);
        setLoading(false);
        return;
      }

      addDebug(`📋 Fetching ${numTotalRegistrations} doctor registrations...`);

      const doctorsData: DoctorData[] = [];

      // Fetch each doctor registration
      for (let i = 1; i <= numTotalRegistrations; i++) {
        try {
          addDebug(`Fetching registration #${i}...`);

          // Use readContract from wagmi directly with the hook pattern
          const response = await fetch('/api/get-doctor-registration', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              registrationId: i,
              contractAddress: doctorRegistryAddress,
            }),
          });

          if (!response.ok) {
            // Fallback to direct contract read if API doesn't exist
            const { readContract } = await import('@wagmi/core');
            const { config } = await import('@/lib/wagmi');

            const result: any = await readContract(config, {
              abi: DoctorRegistry,
              address: doctorRegistryAddress as `0x${string}`,
              functionName: 'getPendingDoctorInfoByID',
              args: [i],
            });

            const doctorInfo = result[0];
            const statusNum = Number(result[1]);
            const statusMap: Record<number, 'pending' | 'approved' | 'denied'> = {
              0: 'pending',
              1: 'approved',
              2: 'denied',
            };

            const doctor: DoctorData = {
              registrationId: Number(doctorInfo.registrationId),
              doctorId: Number(doctorInfo.doctorId),
              name: doctorInfo.Name,
              specialization: doctorInfo.specialization,
              profileDescription: doctorInfo.profileDescription,
              email: doctorInfo.email,
              walletAddress: doctorInfo.doctorAddress,
              consultationFeePerHour: Number(doctorInfo.consultationFeePerHour) / 1e6, // Convert from 6 decimals
              legalDocumentsIPFSHash: doctorInfo.legalDocumentsIPFSHash,
              status: statusMap[statusNum] || 'pending',
            };

            doctorsData.push(doctor);
            addDebug(`✓ Loaded: ${doctor.name} - Status: ${doctor.status}`);
          }
        } catch (error: any) {
          addDebug(`❌ Failed to fetch registration #${i}: ${error.message}`);
        }
      }

      addDebug(`✓ Successfully loaded ${doctorsData.length}/${numTotalRegistrations} doctors`);
      setDoctors(doctorsData);

    } catch (error: any) {
      console.error('Error fetching doctors:', error);
      addDebug(`❌ FATAL ERROR: ${error.message}`);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveDoctor = async (doctorAddress: string) => {
    try {
      setUpdatingDoctor(doctorAddress);
      addDebug(`🔄 Approving doctor: ${doctorAddress}`);

      const tx = await approveDoctor(doctorAddress as `0x${string}`);

      addDebug(`✓ Approve transaction sent: ${tx}`);
      alert('Doctor approved successfully! Transaction: ' + tx);

      // Refresh the list
      setTimeout(() => {
        refetchTotal();
        fetchAllDoctors();
      }, 3000);

    } catch (error: any) {
      addDebug(`❌ Failed to approve: ${error.shortMessage || error.message}`);
      alert(`Failed to approve doctor: ${error.shortMessage || error.message}`);
    } finally {
      setUpdatingDoctor(null);
    }
  };

  const handleDenyDoctor = async (doctorAddress: string) => {
    try {
      setUpdatingDoctor(doctorAddress);
      addDebug(`🔄 Denying doctor: ${doctorAddress}`);

      const tx = await denyDoctor(doctorAddress as `0x${string}`);

      addDebug(`✓ Deny transaction sent: ${tx}`);
      alert('Doctor denied successfully! Transaction: ' + tx);

      // Refresh the list
      setTimeout(() => {
        refetchTotal();
        fetchAllDoctors();
      }, 3000);

    } catch (error: any) {
      addDebug(`❌ Failed to deny: ${error.shortMessage || error.message}`);
      alert(`Failed to deny doctor: ${error.shortMessage || error.message}`);
    } finally {
      setUpdatingDoctor(null);
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    return filter === 'all' || doctor.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'denied':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const countByStatus = (status: string) => {
    return doctors.filter(d => d.status === status).length;
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 border border-blue-200 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2">Wallet Not Connected</h2>
            <ConnectButton />
            <p className="text-secondary">Please connect your wallet to access the admin panel.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!doctorRegistryAddress) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center">
        <div className="glass-card rounded-xl p-8 border border-red-200 max-w-md">
          <div className="text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-primary mb-2">Contract Not Configured</h2>
            <p className="text-secondary mb-4">DoctorRegistry contract address not found for chain ID: {chainId}</p>
            <p className="text-xs text-gray-500 font-mono">Please add the contract address to your constants file.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <header className="glass-card border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-primary tracking-tight">Doctor Verification</h1>
              <div className="mt-3 flex items-center gap-4 text-sm">
                <span className="font-mono text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                  Contract: {doctorRegistryAddress?.slice(0, 10)}...{doctorRegistryAddress?.slice(-8)}
                </span>
                <span className="text-gray-400">•</span>
                <span className="text-blue-600 font-medium">Chain {chainId}</span>
              </div>
            </div>
            <div className="flex items-center">
              <button
                onClick={() => {
                  refetchTotal();
                  fetchAllDoctors();
                }}
                disabled={loading}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 font-semibold"
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 glass-card rounded-xl p-6 border border-red-200 bg-red-50">
            <div className="flex items-start">
              <div className="shrink-0">
                <svg className="h-6 w-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-semibold text-red-800 mb-2">Error Loading Data</h3>
                <p className="text-sm text-red-700 whitespace-pre-wrap">{error}</p>
                <div className="mt-4">
                  <button
                    onClick={fetchAllDoctors}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition text-sm font-medium"
                  >
                    Retry
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-bold text-secondary mb-2">Total Registrations</h3>
            <p className="text-4xl font-bold text-blue-600">{numTotalRegistrations}</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">From blockchain</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-yellow-200 bg-yellow-50">
            <h3 className="text-sm font-bold text-secondary mb-2">Pending</h3>
            <p className="text-4xl font-bold text-yellow-600">{countByStatus('pending')}</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">Awaiting approval</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-green-200 bg-green-50">
            <h3 className="text-sm font-bold text-secondary mb-2">Approved</h3>
            <p className="text-4xl font-bold text-green-600">{countByStatus('approved')}</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">Active doctors</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-red-200 bg-red-50">
            <h3 className="text-sm font-bold text-secondary mb-2">Denied</h3>
            <p className="text-4xl font-bold text-red-600">{countByStatus('denied')}</p>
            <p className="text-sm text-gray-500 mt-2 font-medium">Rejected</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-xl font-bold text-primary mb-4">Filter by Status</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { key: 'all', label: 'All Doctors' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'denied', label: 'Denied' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all ${filter === filterOption.key
                      ? 'bg-blue-600 text-white shadow-lg scale-105'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    }`}
                >
                  {filterOption.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Doctors List */}
        {loading || loadingTotal ? (
          <div className="glass-card rounded-xl p-12 text-center border border-blue-200">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-6"></div>
            <p className="text-xl font-bold text-primary">Loading from blockchain...</p>
            <p className="text-base text-secondary mt-2 font-medium">This may take a few moments</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.registrationId} className="glass-card rounded-xl p-6 border border-blue-200 hover:shadow-xl transition-all">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4 flex-1">
                    <div className="w-16 h-16 rounded-full bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shrink-0">
                      {doctor.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-2xl font-bold text-primary truncate tracking-tight">
                        {doctor.name}
                      </h3>
                      <p className="text-blue-600 font-bold text-lg">{doctor.specialization}</p>

                      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-secondary mb-1 font-bold">Email</div>
                          <div className="font-semibold text-primary truncate">{doctor.email}</div>
                        </div>

                        <div>
                          <div className="text-sm text-secondary mb-1 font-bold">Wallet</div>
                          <div className="font-mono text-sm text-primary font-semibold">
                            {doctor.walletAddress.slice(0, 10)}...{doctor.walletAddress.slice(-8)}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-secondary mb-1 font-bold">Fee/Hour</div>
                          <div className="font-bold text-primary text-lg">
                            ${doctor.consultationFeePerHour.toFixed(2)}
                          </div>
                        </div>

                        <div>
                          <div className="text-xs text-secondary mb-1">Registration ID</div>
                          <div className="font-semibold text-primary">#{doctor.registrationId}</div>
                        </div>

                        {doctor.doctorId > 0 && (
                          <div>
                            <div className="text-xs text-secondary mb-1">Doctor ID</div>
                            <div className="font-semibold text-green-600">#{doctor.doctorId}</div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs text-secondary mb-1">License Document</div>
                          <a
                            href={`https://gateway.pinata.cloud/ipfs/${doctor.legalDocumentsIPFSHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-xs underline font-medium"
                          >
                            View IPFS
                          </a>
                        </div>
                      </div>

                      {doctor.profileDescription && (
                        <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                          <div className="text-xs text-secondary mb-1 font-semibold">About</div>
                          <div className="text-sm text-primary">{doctor.profileDescription}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="text-right ml-6 shrink-0">
                    <span className={`inline-block px-4 py-2 text-sm rounded-full font-bold shadow-sm ${getStatusColor(doctor.status)}`}>
                      {doctor.status.toUpperCase()}
                    </span>

                    {doctor.status === 'pending' && (
                      <div className="mt-4 space-y-2 w-32">
                        <button
                          onClick={() => handleApproveDoctor(doctor.walletAddress)}
                          disabled={updatingDoctor === doctor.walletAddress || isApproving}
                          className="block w-full px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-bold hover:bg-green-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                        >
                          {updatingDoctor === doctor.walletAddress ? '⏳' : '✓'} Approve
                        </button>
                        <button
                          onClick={() => handleDenyDoctor(doctor.walletAddress)}
                          disabled={updatingDoctor === doctor.walletAddress || isDenying}
                          className="block w-full px-4 py-2.5 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 transition-all disabled:opacity-50 shadow-md hover:shadow-lg"
                        >
                          {updatingDoctor === doctor.walletAddress ? '⏳' : '✗'} Deny
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-16 text-center border border-blue-200">
            <div className="w-24 h-24 bg-linear-to-br from-blue-100 to-blue-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-5xl">🏥</span>
            </div>
            <h3 className="text-2xl font-bold text-primary mb-3">No Doctors Found</h3>
            <p className="text-secondary text-lg">
              {filter === 'all'
                ? "No doctor registrations on the blockchain yet."
                : `No ${filter} doctors at the moment.`
              }
            </p>
            {numTotalRegistrations === 0 && !error && (
              <p className="text-sm text-blue-600 mt-4">
                Waiting for doctors to register via the smart contract...
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}