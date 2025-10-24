'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { getAllDoctors, updateDoctorVerificationStatus } from '@/lib/firebase/firestore';

interface DoctorWithId {
  id: string;
  email: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  walletAddress?: string;
  profilePicture?: string;
  bio?: string;
  experience?: number;
  createdAt: any;
}

export default function AdminDoctors() {
  const [doctors, setDoctors] = useState<DoctorWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [updatingDoctor, setUpdatingDoctor] = useState<string | null>(null);

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      const doctorsData = await getAllDoctors();
      setDoctors(doctorsData as DoctorWithId[]);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerificationUpdate = async (doctorId: string, status: 'pending' | 'approved' | 'rejected') => {
    try {
      setUpdatingDoctor(doctorId);
      await updateDoctorVerificationStatus(doctorId, status);

      // Update local state
      setDoctors(prevDoctors =>
        prevDoctors.map(doctor =>
          doctor.id === doctorId
            ? { ...doctor, verificationStatus: status }
            : doctor
        )
      );

      alert(`Doctor ${status === 'approved' ? 'approved' : status === 'rejected' ? 'rejected' : 'reset to pending'} successfully!`);
    } catch (error) {
      console.error('Error updating verification status:', error);
      alert('Failed to update verification status. Please try again.');
    } finally {
      setUpdatingDoctor(null);
    }
  };

  const filteredDoctors = doctors.filter(doctor =>
    filter === 'all' || doctor.verificationStatus === filter
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <header className="glass-card border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-primary">Doctor Verification</h1>
              <p className="text-secondary">Manage doctor registrations and verification status</p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/admin"
                className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
              >
                Back to Admin
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Total Doctors</h3>
            <p className="text-3xl font-bold text-blue-600">{doctors.length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Pending</h3>
            <p className="text-3xl font-bold text-blue-500">{doctors.filter(d => d.verificationStatus === 'pending').length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Approved</h3>
            <p className="text-3xl font-bold text-blue-400">{doctors.filter(d => d.verificationStatus === 'approved').length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-lg font-semibold text-primary mb-2">Rejected</h3>
            <p className="text-3xl font-bold text-blue-300">{doctors.filter(d => d.verificationStatus === 'rejected').length}</p>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h2 className="text-lg font-semibold text-primary mb-4">Filter Doctors</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { key: 'all', label: 'All Doctors' },
                { key: 'pending', label: 'Pending' },
                { key: 'approved', label: 'Approved' },
                { key: 'rejected', label: 'Rejected' }
              ].map((filterOption) => (
                <button
                  key={filterOption.key}
                  onClick={() => setFilter(filterOption.key as any)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${filter === filterOption.key
                      ? 'bg-blue-600 text-white'
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
        {loading ? (
          <div className="glass-card rounded-xl p-8 text-center border border-blue-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-secondary">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length > 0 ? (
          <div className="space-y-4">
            {filteredDoctors.map((doctor) => (
              <div key={doctor.id} className="glass-card rounded-xl p-6 border border-blue-200">
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    {/* Doctor Avatar */}
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                      {doctor.profilePicture ? (
                        <img
                          src={doctor.profilePicture}
                          alt={doctor.fullName}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        doctor.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
                      )}
                    </div>

                    {/* Doctor Details */}
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-primary">
                        Dr. {doctor.fullName}
                      </h3>
                      <p className="text-blue-600 font-medium">{doctor.specialization}</p>

                      <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-sm text-secondary mb-1">Email</div>
                          <div className="font-medium text-primary">{doctor.email}</div>
                        </div>

                        <div>
                          <div className="text-sm text-secondary mb-1">License Number</div>
                          <div className="font-medium text-primary">{doctor.licenseNumber}</div>
                        </div>

                        <div>
                          <div className="text-sm text-secondary mb-1">Experience</div>
                          <div className="font-medium text-primary">
                            {doctor.experience ? `${doctor.experience} years` : 'Not specified'}
                          </div>
                        </div>

                        <div>
                          <div className="text-sm text-secondary mb-1">Registration Date</div>
                          <div className="font-medium text-primary">{formatDate(doctor.createdAt)}</div>
                        </div>
                      </div>

                      {doctor.bio && (
                        <div className="mt-3">
                          <div className="text-sm text-secondary mb-1">Bio</div>
                          <div className="text-sm text-primary">{doctor.bio}</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Status and Actions */}
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(doctor.verificationStatus)}`}>
                      {doctor.verificationStatus.charAt(0).toUpperCase() + doctor.verificationStatus.slice(1)}
                    </span>

                    {doctor.verificationStatus === 'pending' && (
                      <div className="mt-4 space-y-2">
                        <button
                          onClick={() => handleVerificationUpdate(doctor.id, 'approved')}
                          disabled={updatingDoctor === doctor.id}
                          className="block w-full px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {updatingDoctor === doctor.id ? 'Updating...' : 'Approve'}
                        </button>
                        <button
                          onClick={() => handleVerificationUpdate(doctor.id, 'rejected')}
                          disabled={updatingDoctor === doctor.id}
                          className="block w-full px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors disabled:opacity-50"
                        >
                          {updatingDoctor === doctor.id ? 'Updating...' : 'Reject'}
                        </button>
                      </div>
                    )}

                    {doctor.verificationStatus !== 'pending' && (
                      <div className="mt-4">
                        <button
                          onClick={() => handleVerificationUpdate(doctor.id, 'pending')}
                          disabled={updatingDoctor === doctor.id}
                          className="block w-full px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                          {updatingDoctor === doctor.id ? 'Updating...' : 'Reset to Pending'}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="glass-card rounded-xl p-12 text-center border border-blue-200">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-primary mb-2">No doctors found</h3>
            <p className="text-secondary">
              {filter === 'all'
                ? "No doctors have registered yet."
                : `No ${filter} doctors found.`
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}