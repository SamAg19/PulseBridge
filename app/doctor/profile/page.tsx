'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { ArrowLeft, User, Mail, MapPin, Shield, Edit3, Save, Award, Clock, Star } from 'lucide-react';
import { getDoctorById, updateDoctorProfile } from '@/lib/firebase/firestore';
import { DoctorProfile } from '@/lib/types';

export default function DoctorProfilePage() {
  const { address } = useAccount();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<DoctorProfile | null>(null);
  const [editedProfile, setEditedProfile] = useState<Partial<DoctorProfile>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (address) {
      fetchProfile();
    }
  }, [address]);

  const fetchProfile = async () => {
    if (!address) return;
    
    try {
      setLoading(true);
      const profileData = await getDoctorById(address);
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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !address) return;

    try {
      setSaving(true);
      await updateDoctorProfile(address, editedProfile);
      setProfile({ ...profile, ...editedProfile } as DoctorProfile);
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



  const getVerificationStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <Star key="half" className="w-4 h-4 text-yellow-400 fill-current opacity-50" />
      );
    }

    for (let i = fullStars + (hasHalfStar ? 1 : 0); i < 5; i++) {
      stars.push(
        <Star key={i} className="w-4 h-4 text-gray-300" />
      );
    }

    return stars;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header with Navigation */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <button
              onClick={() => router.back()}
              className="p-2 hover:bg-blue-100 rounded-full transition-colors"
              title="Go Back"
            >
              <ArrowLeft className="w-5 h-5 text-blue-600" />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary">My Profile</h1>
              <p className="text-secondary">View and manage your professional profile</p>
            </div>
          </div>
          
          {/* Breadcrumbs */}
          <nav className="text-sm text-secondary">
            <span>Dashboard</span>
            <span className="mx-2">/</span>
            <span className="text-primary font-medium">Profile</span>
          </nav>
        </div>

        {/* Main Content */}
        <div className="glass-card rounded-2xl border border-blue-200 overflow-hidden">
          {/* Header Actions */}
          <div className="bg-white/80 backdrop-blur-sm border-b border-blue-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {profile?.profilePicture ? (
                  <img 
                    src={profile.profilePicture} 
                    alt="Profile" 
                    className="w-16 h-16 rounded-full object-cover border-2 border-blue-200"
                  />
                ) : (
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="w-8 h-8 text-blue-600" />
                  </div>
                )}
                <div>
                  <h2 className="text-xl font-bold text-primary">
                    Dr. {profile?.fullName || 'Your Name'}
                  </h2>
                  <p className="text-secondary">{profile?.specialization || 'Specialization'}</p>
                </div>
              </div>
              
              {!editing && profile && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              )}
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
                <p className="text-gray-600">Please complete your doctor registration first.</p>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Wallet Information */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                    <Shield className="w-5 h-5 mr-2" />
                    Wallet Information
                  </h3>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-medium text-gray-700">Wallet Address:</span>
                      <span className="text-sm text-gray-900 font-mono bg-white px-3 py-1 rounded border">
                        {address ? `${address.slice(0, 6)}...${address.slice(-4)}` : 'Not connected'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">Verification Status:</span>
                      <span className={`text-sm px-3 py-1 rounded-full ${getVerificationStatusColor(profile.verificationStatus || 'pending')}`}>
                        {profile.verificationStatus?.charAt(0).toUpperCase() + (profile.verificationStatus?.slice(1) || '')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Professional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                    <Award className="w-5 h-5 mr-2" />
                    Professional Information
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                          Dr. {profile.fullName || 'Not provided'}
                        </div>
                      )}
                      {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Specialization
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="specialization"
                          value={editedProfile.specialization || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {profile.specialization || 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Experience (Years)
                      </label>
                      {editing ? (
                        <input
                          type="number"
                          name="experience"
                          value={editedProfile.experience || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {profile.experience ? `${profile.experience} years` : 'Not provided'}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        License Number
                      </label>
                      {editing ? (
                        <input
                          type="text"
                          name="licenseNumber"
                          value={editedProfile.licenseNumber || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {profile.licenseNumber || 'Not provided'}
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
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                        Consultation Fee (ETH)
                      </label>
                      {editing ? (
                        <input
                          type="number"
                          step="0.001"
                          name="consultationFee"
                          value={editedProfile.consultationFee || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {profile.consultationFee ? `${profile.consultationFee} ETH` : 'Not set'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Professional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                    <MapPin className="w-5 h-5 mr-2" />
                    Professional Details
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Picture URL
                      </label>
                      {editing ? (
                        <input
                          type="url"
                          name="profilePicture"
                          value={editedProfile.profilePicture || ''}
                          onChange={handleInputChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="https://example.com/your-photo.jpg"
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900">
                          {profile.profilePicture ? (
                            <div className="flex items-center space-x-3">
                              <img 
                                src={profile.profilePicture} 
                                alt="Profile" 
                                className="w-10 h-10 rounded-full object-cover"
                              />
                              <span className="text-sm text-blue-600">Profile picture set</span>
                            </div>
                          ) : (
                            'Not provided'
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bio
                      </label>
                      {editing ? (
                        <textarea
                          name="bio"
                          value={editedProfile.bio || ''}
                          onChange={handleInputChange}
                          rows={4}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Tell patients about yourself and your practice..."
                        />
                      ) : (
                        <div className="px-4 py-3 bg-gray-50 rounded-lg text-gray-900 min-h-[100px]">
                          {profile.bio || 'Not provided'}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                {profile.verificationStatus === 'approved' && (
                  <div>
                    <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                      <Clock className="w-5 h-5 mr-2" />
                      Statistics
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-blue-50 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-blue-600 mb-2">
                          {profile.totalReviews || 0}
                        </div>
                        <div className="text-sm text-blue-700">Total Reviews</div>
                      </div>
                      
                      <div className="bg-green-50 rounded-lg p-6 text-center">
                        <div className="flex items-center justify-center space-x-1 mb-2">
                          {renderStars(profile.rating || 0)}
                        </div>
                        <div className="text-3xl font-bold text-green-600 mb-2">
                          {profile.rating ? profile.rating.toFixed(1) : '0.0'}
                        </div>
                        <div className="text-sm text-green-700">Average Rating</div>
                      </div>
                      
                      <div className="bg-purple-50 rounded-lg p-6 text-center">
                        <div className="text-3xl font-bold text-purple-600 mb-2">
                          {profile.consultationFee ? `${profile.consultationFee}` : '0.001'}
                        </div>
                        <div className="text-sm text-purple-700">Fee (ETH)</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {editing && (
                  <div className="flex flex-col sm:flex-row gap-4 pt-6 border-t border-gray-200">
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
    </div>
  );
}