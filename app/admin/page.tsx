'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { updateDoctorVerificationStatus } from '@/lib/firebase/firestore';
import { DoctorProfile } from '@/lib/types';

interface DoctorWithId extends DoctorProfile {
  id: string;
  walletAddress: string;
}

export default function AdminPage() {
  const [doctors, setDoctors] = useState<DoctorWithId[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check admin authentication
    const adminAuth = localStorage.getItem('adminAuth');
    if (adminAuth === 'true') {
      setIsAuthenticated(true);
    } else {
      window.location.href = '/admin/login';
    }
  }, []);

  useEffect(() => {
    fetchDoctors();
  }, [filter]);

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      let q;
      
      if (filter === 'all') {
        q = query(collection(db, 'doctors'));
      } else {
        q = query(
          collection(db, 'doctors'),
          where('verificationStatus', '==', filter)
        );
      }
      
      const querySnapshot = await getDocs(q);
      let doctorsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as DoctorWithId[];
      
      // Sort in memory instead of using Firestore orderBy
      doctorsList = doctorsList.sort((a, b) => {
        const aTime = a.createdAt?.toDate?.() || new Date(0);
        const bTime = b.createdAt?.toDate?.() || new Date(0);
        return bTime.getTime() - aTime.getTime(); // Descending order
      });
      
      setDoctors(doctorsList);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerification = async (doctorId: string, status: 'approved' | 'rejected') => {
    try {
      await updateDoctorVerificationStatus(doctorId, status);
      // Refresh the list
      fetchDoctors();
    } catch (error) {
      console.error('Error updating verification status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminAuth');
    window.location.href = '/admin/login';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center">
        <div className="text-primary text-xl">Checking authentication...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-blue">
      <nav className="glass-card border-b border-blue-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Admin Dashboard</h1>
            <p className="text-secondary">Doctor Verification System</p>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 text-secondary hover:text-primary transition font-medium"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        {/* Filter Tabs */}
        <div className="mb-8">
          <div className="flex space-x-1 bg-blue-100 p-1 rounded-xl">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filter === status
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-secondary hover:text-primary'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-secondary mb-1">Total Doctors</h3>
            <p className="text-2xl font-bold text-primary">{doctors.length}</p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-secondary mb-1">Pending Review</h3>
            <p className="text-2xl font-bold text-yellow-600">
              {doctors.filter(d => d.verificationStatus === 'pending').length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-secondary mb-1">Approved</h3>
            <p className="text-2xl font-bold text-green-600">
              {doctors.filter(d => d.verificationStatus === 'approved').length}
            </p>
          </div>
          <div className="glass-card rounded-xl p-6 border border-blue-200">
            <h3 className="text-sm font-medium text-secondary mb-1">Rejected</h3>
            <p className="text-2xl font-bold text-red-600">
              {doctors.filter(d => d.verificationStatus === 'rejected').length}
            </p>
          </div>
        </div>

        {/* Doctors List */}
        <div className="glass-card rounded-xl border border-blue-200">
          <div className="p-6 border-b border-blue-200">
            <h2 className="text-xl font-bold text-primary">
              Doctor Applications ({filter === 'all' ? 'All' : filter.charAt(0).toUpperCase() + filter.slice(1)})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="text-secondary">Loading doctors...</div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="p-8 text-center">
              <div className="text-secondary">No doctors found for the selected filter.</div>
            </div>
          ) : (
            <div className="divide-y divide-blue-200">
              {doctors.map((doctor) => (
                <div key={doctor.id} className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <h3 className="text-lg font-semibold text-primary">{doctor.fullName}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(doctor.verificationStatus)}`}>
                          {doctor.verificationStatus.toUpperCase()}
                        </span>
                      </div>
                      
                      <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-secondary mb-1">
                            <span className="font-medium text-primary">Email:</span> {doctor.email}
                          </p>
                          <p className="text-secondary mb-1">
                            <span className="font-medium text-primary">Specialization:</span> {doctor.specialization}
                          </p>
                        </div>
                        <div>
                          <p className="text-secondary mb-1">
                            <span className="font-medium text-primary">License:</span> {doctor.licenseNumber}
                          </p>
                          <p className="text-secondary mb-1">
                            <span className="font-medium text-primary">Wallet:</span> 
                            <span className="font-mono text-xs bg-blue-50 px-2 py-1 rounded ml-2">
                              {doctor.walletAddress?.slice(0, 6)}...{doctor.walletAddress?.slice(-4)}
                            </span>
                          </p>
                        </div>
                      </div>
                      
                      <p className="text-xs text-secondary mt-2">
                        Applied: {doctor.createdAt?.toDate?.()?.toLocaleDateString() || 'Unknown'}
                      </p>
                    </div>

                    {doctor.verificationStatus === 'pending' && (
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => handleVerification(doctor.id, 'approved')}
                          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleVerification(doctor.id, 'rejected')}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}