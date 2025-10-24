'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { getVerifiedDoctorsWithTasks, checkPatientExists } from '@/lib/firebase/firestore';
import { DoctorWithTasks } from '@/lib/types';
import DoctorCard from '@/components/DoctorCard';
import Pagination from '@/components/Pagination';
import PatientRegistrationModal from '@/components/PatientRegistrationModal';
import RegistrationPrompt from '@/components/RegistrationPrompt';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Search, Filter, Users, Clock, Coins, Calendar, CreditCard } from 'lucide-react';

export default function PatientDashboard() {
  const { address, isConnected } = useAccount();
  const [doctors, setDoctors] = useState<DoctorWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);
  const [checkingRegistration, setCheckingRegistration] = useState(true);
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [showRegistrationPrompt, setShowRegistrationPrompt] = useState(false);

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

  useEffect(() => {
    if (isConnected && address) {
      checkPatientRegistration();
    }
  }, [isConnected, address]);

  const checkPatientRegistration = async () => {
    if (!address) return;
    
    try {
      setCheckingRegistration(true);
      const exists = await checkPatientExists(address);
      setIsRegistered(exists);
      
      if (!exists) {
        // Show prompt after a short delay to let the user see the dashboard first
        setTimeout(() => {
          setShowRegistrationPrompt(true);
        }, 2000);
      }
    } catch (error) {
      console.error('Error checking patient registration:', error);
    } finally {
      setCheckingRegistration(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const result = await getVerifiedDoctorsWithTasks(currentPage, 6);

      let filteredDoctors = result.doctors;

      // Filter by specialization
      if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
        filteredDoctors = filteredDoctors.filter(
          doctor => doctor.specialization === selectedSpecialization
        );
      }

      // Filter by search query
      if (searchQuery.trim()) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          doctor.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization.toLowerCase().includes(searchQuery.toLowerCase())
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

  const handleRegistrationSuccess = () => {
    setIsRegistered(true);
    setShowRegistrationModal(false);
    setShowRegistrationPrompt(false);
  };

  const handleShowRegistrationModal = () => {
    setShowRegistrationPrompt(false);
    setShowRegistrationModal(true);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Connect Your Wallet</h1>
            <p className="text-secondary text-sm sm:text-base">Please connect your wallet to access the healthcare platform and book appointments with verified doctors.</p>
          </div>
          <ConnectButton />
        </div>
      </div>
    );
  }

  if (checkingRegistration) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-6 sm:p-8 text-center max-w-md w-full border border-blue-200">
          <div className="mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <Users className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-primary mb-2">Checking Registration</h1>
            <p className="text-secondary text-sm sm:text-base">Please wait while we verify your account...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveLayout 
      userType="patient" 
      title="Find Healthcare Providers" 
      subtitle="Book appointments with verified doctors"
    >
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6">
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-primary">Verified Doctors</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-600">{totalDoctors}</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-primary">Available Support</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-500">24/7</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Coins className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-semibold text-primary">Starting From</h3>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">0.001 ETH</p>
              </div>
            </div>
          </div>
          
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200 sm:col-span-2 lg:col-span-1">
            <h3 className="text-sm sm:text-base font-semibold text-primary mb-3">Quick Access</h3>
            <div className="space-y-2">
              <a href="/patient/appointments" className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <Calendar className="w-4 h-4 mr-2" />
                My Appointments
              </a>
              <a href="/patient/payments" className="flex items-center text-sm text-blue-600 hover:text-blue-800 transition-colors">
                <CreditCard className="w-4 h-4 mr-2" />
                Payment History
              </a>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4 sm:space-y-6 mb-6">
          {/* Search Bar */}
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <Search className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold text-primary">Search Doctors</h2>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search by doctor name or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-4 py-3 pl-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
              />
              <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />
            </div>
          </div>

          {/* Specialization Filters */}
          <div className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
            <div className="flex items-center space-x-2 mb-4">
              <Filter className="w-5 h-5 text-blue-600" />
              <h2 className="text-base sm:text-lg font-semibold text-primary">Filter by Specialization</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {specializations.map((spec) => (
                <button
                  key={spec}
                  onClick={() => handleSpecializationFilter(spec)}
                  className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${
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

        {/* Doctors Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="glass-card rounded-xl p-4 sm:p-6 animate-pulse border border-blue-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gray-200 rounded-full"></div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {doctors.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} />
              ))}
            </div>
            
            <div className="flex justify-center mt-8">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          </>
        ) : (
          <div className="glass-card rounded-xl p-6 sm:p-12 text-center border border-blue-200">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
            </div>
            <h3 className="text-base sm:text-lg font-medium text-primary mb-2">No doctors found</h3>
            <p className="text-secondary mb-4 text-sm sm:text-base">
              {searchQuery ? `No doctors match "${searchQuery}"` : 'Try adjusting your filters or check back later.'}
            </p>
            {(searchQuery || selectedSpecialization) && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedSpecialization('');
                  fetchDoctors();
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
              >
                Clear Filters
              </button>
            )}
          </div>
        )}

        {/* Registration Prompt */}
        <RegistrationPrompt
          isVisible={showRegistrationPrompt && !isRegistered}
          onClose={() => setShowRegistrationPrompt(false)}
          onRegister={handleShowRegistrationModal}
        />

        {/* Patient Registration Modal */}
        <PatientRegistrationModal
          isOpen={showRegistrationModal}
          onClose={() => setShowRegistrationModal(false)}
          onSuccess={handleRegistrationSuccess}
        />
    </ResponsiveLayout>
  );
}