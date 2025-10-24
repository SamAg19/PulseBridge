'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getVerifiedDoctorsWithTasks } from '@/lib/firebase/firestore';
import { DoctorWithTasks } from '@/lib/types';
import DoctorCard from '@/components/DoctorCard';
import Pagination from '@/components/Pagination';

export default function PatientDashboard() {
  const { address, isConnected } = useAccount();
  const [doctors, setDoctors] = useState<DoctorWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');

  const specializations = [
    'All Specializations',
    'Cardiology',
    'Dermatology',
    'Neurology',
    'Pediatrics',
    'Psychiatry',
    'Orthopedics',
    'General Medicine'
  ];

  useEffect(() => {
    fetchDoctors();
  }, [currentPage]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getVerifiedDoctorsWithTasks(currentPage, 6);
      
      let filteredDoctors = result.doctors;
      if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
        filteredDoctors = result.doctors.filter(
          doctor => doctor.specialization === selectedSpecialization
        );
      }
      
      setDoctors(filteredDoctors);
      setTotalPages(result.totalPages);
      setTotalDoctors(result.totalDoctors);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationFilter = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setCurrentPage(1);
    fetchDoctors();
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-2xl shadow-xl text-center max-w-md">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h1>
            <p className="text-gray-600">Please connect your wallet to access the healthcare platform and book appointments with verified doctors.</p>
          </div>
          <ConnectButton />
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
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Healthcare Platform</h1>
                <p className="text-secondary">Find and book appointments with verified doctors</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <a 
                href="/patient/appointments" 
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                My Appointments
              </a>
              <a 
                href="/patient/payments" 
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Payment History
              </a>
              <ConnectButton />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-primary mb-4">Filter by Specialization</h2>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => handleSpecializationFilter(spec)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedSpecialization === spec || (spec === 'All Specializations' && !selectedSpecialization)
                      ? 'bg-blue-600 text-white'
                      : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  }`}
                >
                  {spec}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="glass-card rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-primary mb-2">Verified Doctors</h3>
              <p className="text-3xl font-bold text-blue-600">{totalDoctors}</p>
            </div>
            <div className="glass-card rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-primary mb-2">Available Support</h3>
              <p className="text-3xl font-bold text-blue-500">24/7</p>
            </div>
            <div className="glass-card rounded-xl p-6 border border-blue-200">
              <h3 className="text-lg font-semibold text-primary mb-2">Starting From</h3>
              <p className="text-3xl font-bold text-blue-400">0.001 ETH</p>
            </div>
          </div>
        </div>

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm p-6 animate-pulse">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded"></div>
                  <div className="h-3 bg-gray-200 rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        ) : doctors.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
            
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No doctors found</h3>
            <p className="text-gray-600">Try adjusting your filters or check back later.</p>
          </div>
        )}
      </div>
    </div>
  );
}