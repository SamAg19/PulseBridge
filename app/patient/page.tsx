'use client';

import { useState, useEffect } from 'react';
import { useAccount, useReadContracts } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { DoctorWithTasks, TimeSlot } from '@/lib/types';
import DoctorCard from '@/components/DoctorCard';
import Pagination from '@/components/Pagination';
import ResponsiveLayout from '@/components/ResponsiveLayout';
import { Search, Filter, Users, Clock, Coins, Calendar, CreditCard, X } from 'lucide-react';
import { useGetTotalDoctors, useContractAddress } from '@/lib/contracts/hooks';
import { DoctorRegistry } from '@/lib/constants';
import { getAllDoctors } from "@/lib/contracts/utils"
import { formatUnits } from 'viem';
import { useChainId } from 'wagmi'
import { getDoctorAvailabilityById, getAvailableSlots } from '@/lib/firebase/availability';

export default function PatientDashboard() {
  const { address, isConnected } = useAccount();
  const [doctors, setDoctors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalDoctors, setTotalDoctors] = useState(0);
  const [selectedSpecialization, setSelectedSpecialization] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // Time slots modal state
  const [showTimeSlotsModal, setShowTimeSlotsModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const chainId = useChainId()

  // Get total doctors from contract
  const { totalDoctors: contractTotalDoctors, isLoading: contractLoading } = useGetTotalDoctors();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  // Set total doctors once when contract data loads
  useEffect(() => {
    if (!contractLoading && contractTotalDoctors > 0) {
      setTotalDoctors(contractTotalDoctors);
    }
  }, [contractLoading, contractTotalDoctors]);

  // Fetch multiple doctors using useReadContracts
  const itemsPerPage = 6;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = Math.min(startIndex + itemsPerPage, totalDoctors);

  const doctorContracts = Array.from({ length: endIndex - startIndex }, (_, i) => ({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'getDoctor',
    args: [startIndex + i],
  }));

  const { data: doctorsData, isLoading: doctorsLoading } = useReadContracts({
    contracts: doctorContracts,
    query: {
      enabled: !!doctorRegistryAddress && totalDoctors > 0,
    },
  });

  // Transform contract data to display format
  useEffect(() => {
    if (doctorsData && !doctorsLoading) {
      const transformedDoctors = doctorsData
        .map((result: any, index) => {
          if (result.status === 'success' && result.result) {
            const data = result.result;
            return {
              doctorId: Number(data.doctorId),
              registrationId: Number(data.registrationId),
              name: data.Name,
              specialization: data.specialization,
              profileDescription: data.profileDescription,
              email: data.email,
              walletAddress: data.doctorAddress,
              consultationFeePerHour: Number(formatUnits(data.consultationFeePerHour, 6)),
              legalDocumentsIPFSHash: data.legalDocumentsIPFSHash,
            };
          }
          return null;
        })
        .filter((doctor: any) => doctor !== null);

      // Apply filters
      let filteredDoctors = transformedDoctors;

      if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
        filteredDoctors = filteredDoctors.filter(
          (doctor: any) => doctor.specialization === selectedSpecialization
        );
      }

      if (searchQuery.trim()) {
        filteredDoctors = filteredDoctors.filter((doctor: any) =>
          doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setDoctors(filteredDoctors);
      setTotalPages(Math.ceil(totalDoctors / itemsPerPage));
      setLoading(false);
    }
  }, [doctorsData, doctorsLoading, selectedSpecialization, searchQuery, totalDoctors]);

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
    if (totalDoctors > 0) {
      fetchDoctors();
    }
  }, [totalDoctors, currentPage]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);

      const itemsPerPage = 6;
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = Math.min(startIndex + itemsPerPage, totalDoctors);


      const fetchedDoctors = await getAllDoctors(chainId);

      let filteredDoctors = fetchedDoctors;

      // Filter by specialization
      if (selectedSpecialization && selectedSpecialization !== 'All Specializations') {
        filteredDoctors = filteredDoctors.filter(
          doctor => doctor.specialization === selectedSpecialization
        );
      }

      // Filter by search query
      if (searchQuery.trim()) {
        filteredDoctors = filteredDoctors.filter(doctor =>
          doctor.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          doctor.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }

      setDoctors(filteredDoctors);
      setTotalPages(Math.ceil(totalDoctors / itemsPerPage));
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSpecializationFilter = (specialization: string) => {
    setSelectedSpecialization(specialization);
    setCurrentPage(1);
  };

  useEffect(() => {
    if (totalDoctors > 0) {
      fetchDoctors();
    }
  }, [selectedSpecialization, searchQuery]);

  const handleBookNow = async (doctor: any) => {
    setSelectedDoctor(doctor);
    setShowTimeSlotsModal(true);
    setLoadingSlots(true);

    try {
      // Fetch available time slots from Firebase
      const availability = await getDoctorAvailabilityById(doctor.doctorId);

      if (availability && availability.timeSlots) {
        // Filter only available (non-booked) slots
        const slots = availability.timeSlots.filter((slot: TimeSlot) => !slot.isBooked);
        setAvailableSlots(slots);
      } else {
        setAvailableSlots([]);
      }
    } catch (error) {
      console.error('Error fetching time slots:', error);
      setAvailableSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleCloseModal = () => {
    setShowTimeSlotsModal(false);
    setSelectedDoctor(null);
    setAvailableSlots([]);
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
              <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-400">50 PYUSD</p>
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
                className={`px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium transition-colors ${selectedSpecialization === spec || (spec === 'All Specializations' && !selectedSpecialization)
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
            {doctors.map((doctor, index) => (
              <div key={doctor.doctorId || index} className="glass-card rounded-xl p-4 sm:p-6 border border-blue-200">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-primary">{doctor.name}</h3>
                    <p className="text-sm text-secondary">{doctor.specialization}</p>
                  </div>
                </div>
                <p className="text-sm text-secondary mb-3">{doctor.profileDescription}</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-600">{doctor.consultationFeePerHour} PYUSD/hr</span>
                  <button
                    onClick={() => handleBookNow(doctor)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                  >
                    Book Now
                  </button>
                </div>
              </div>
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
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
            >
              Clear Filters
            </button>
          )}
        </div>
      )}

      {/* Time Slots Modal */}
      {showTimeSlotsModal && selectedDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-blue-200 p-6 rounded-t-2xl">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <Users className="w-8 h-8 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-primary">{selectedDoctor.name}</h2>
                    <p className="text-secondary">{selectedDoctor.specialization}</p>
                    <p className="text-sm text-blue-600 font-medium mt-1">
                      {selectedDoctor.consultationFeePerHour} PYUSD/hr
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCloseModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6 text-gray-600" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6">
              <h3 className="text-lg font-semibold text-primary mb-4">Available Time Slots</h3>

              {loadingSlots ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
                  <p className="text-secondary">Loading available time slots...</p>
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="space-y-3">
                  {availableSlots.map((slot, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 bg-blue-50 rounded-xl border border-blue-200 hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center space-x-4">
                        <Calendar className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-primary">
                            {new Date(slot.date).toLocaleDateString('en-US', {
                              weekday: 'long',
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </p>
                          <p className="text-sm text-secondary">
                            {slot.startTime} - {slot.endTime}
                          </p>
                        </div>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
                        Select
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Clock className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-primary mb-2">No Available Slots</h3>
                  <p className="text-secondary">
                    This doctor doesn't have any available time slots at the moment.
                    <br />
                    Please check back later or contact the doctor directly.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ResponsiveLayout>
  );
}