'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { X, User, Mail, Phone, MapPin, Calendar, Shield, Edit3, Save } from 'lucide-react';
import { getPatientProfile, updatePatientProfile, PatientProfile } from '@/lib/firebase/firestore';

interface PatientProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PatientProfileModal({ isOpen, onClose }: PatientProfileModalProps) {
  const { address } = useAccount();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<PatientProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<PatientProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen && address) {
      fetchProfile();
    }
  }, [isOpen, address]);

  const fetchProfile = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const profileData = await getPatientProfile(address);
      setProfile(profileData);
      setEditedProfile(profileData || {});
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!editedProfile.fullName?.trim()) {
      newErrors.fullName = 'Full name is required';
    }

    if (!editedProfile.email?.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editedProfile.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!editedProfile.phoneNumber?.trim()) {
      newErrors.phoneNumber = 'Phone number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !address) return;

    try {
      setSaving(true);
      await updatePatientProfile(address, editedProfile);
      setProfile({ ...profile, ...editedProfile } as PatientProfile);
      setEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setEditedProfile(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const formatDate = (date: Date | string) => {
    if (!date) return 'Not provided';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
        <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-blue-200 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-primary">My Profile</h2>
              <p className="text-secondary text-sm sm:text-base">View and manage your profile information</p>
            </div>
            <div className="flex items-center space-x-2">
              {!editing && profile && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-2 hover:bg-blue-100 rounded-full transition-colors"
                  title="Edit Profile"
                >
                  <Edit3 className="w-5 h-5 text-blue-600" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-secondary">Loading profile...</span>
            </div>
          ) : !profile ? (
            <div className="text-center py-12">
              <User className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Profile Found</h3>
              <p className="text-gray-600">Please complete your registration first.</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Wallet Information */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Wallet Information
                </h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">Wallet Address:</span>
                    <span className="text-sm text-gray-900 font-mono bg-white px-2 py-1 rounded border">
                      {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm font-medium text-gray-700">Registration Date:</span>
                    <span className="text-sm text-gray-900">
                      {formatDate(profile.registrationDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <User className="w-5 h-5 mr-2" />
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="fullName"
                        value={editedProfile.fullName || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.fullName ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.fullName || 'Not provided'}
                      </div>
                    )}
                    {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date of Birth
                    </label>
                    {editing ? (
                      <input
                        type="date"
                        name="dateOfBirth"
                        value={editedProfile.dateOfBirth || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.dateOfBirth ? new Date(profile.dateOfBirth).toLocaleDateString() : 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2" />
                  Contact Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    {editing ? (
                      <input
                        type="email"
                        name="email"
                        value={editedProfile.email || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.email || 'Not provided'}
                      </div>
                    )}
                    {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        name="phoneNumber"
                        value={editedProfile.phoneNumber || ''}
                        onChange={handleInputChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                          errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.phoneNumber || 'Not provided'}
                      </div>
                    )}
                    {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      name="address"
                      value={editedProfile.address || ''}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  ) : (
                    <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                      {profile.address || 'Not provided'}
                    </div>
                  )}
                </div>
              </div>

              {/* Emergency Contact */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2" />
                  Emergency Contact
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Name
                    </label>
                    {editing ? (
                      <input
                        type="text"
                        name="emergencyContact"
                        value={editedProfile.emergencyContact || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.emergencyContact || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Emergency Contact Phone
                    </label>
                    {editing ? (
                      <input
                        type="tel"
                        name="emergencyPhone"
                        value={editedProfile.emergencyPhone || ''}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                        {profile.emergencyPhone || 'Not provided'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Medical Information */}
              <div>
                <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                  <MapPin className="w-5 h-5 mr-2" />
                  Medical Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Medical History
                    </label>
                    {editing ? (
                      <textarea
                        name="medicalHistory"
                        value={editedProfile.medicalHistory || ''}
                        onChange={handleInputChange}
                        rows={3}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[80px]">
                        {profile.medicalHistory || 'Not provided'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Allergies
                    </label>
                    {editing ? (
                      <textarea
                        name="allergies"
                        value={editedProfile.allergies || ''}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                        {profile.allergies || 'No known allergies'}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Medications
                    </label>
                    {editing ? (
                      <textarea
                        name="currentMedications"
                        value={editedProfile.currentMedications || ''}
                        onChange={handleInputChange}
                        rows={2}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    ) : (
                      <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[60px]">
                        {profile.currentMedications || 'No current medications'}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              {editing && (
                <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setEditedProfile(profile || {});
                      setErrors({});
                    }}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 flex items-center justify-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}