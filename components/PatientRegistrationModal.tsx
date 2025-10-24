'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { X, User, Mail, Phone, MapPin } from 'lucide-react';

interface PatientRegistrationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function PatientRegistrationModal({ isOpen, onClose, onSuccess }: PatientRegistrationModalProps) {
    const { address } = useAccount();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        emergencyContact: '',
        emergencyPhone: '',
        medicalHistory: '',
        allergies: '',
        currentMedications: ''
    });

    const [errors, setErrors] = useState<Record<string, string>>({});

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.fullName.trim()) {
            newErrors.fullName = 'Full name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.phoneNumber.trim()) {
            newErrors.phoneNumber = 'Phone number is required';
        }

        if (!formData.dateOfBirth) {
            newErrors.dateOfBirth = 'Date of birth is required';
        }

        if (!formData.address.trim()) {
            newErrors.address = 'Address is required';
        }

        if (!formData.emergencyContact.trim()) {
            newErrors.emergencyContact = 'Emergency contact name is required';
        }

        if (!formData.emergencyPhone.trim()) {
            newErrors.emergencyPhone = 'Emergency contact phone is required';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !address) return;

        try {
            setLoading(true);

            // Import the function dynamically to avoid build issues
            const { createPatientProfile } = await import('@/lib/firebase/firestore');

            await createPatientProfile(address, {
                ...formData,
                registrationDate: new Date(),
                isActive: true
            });

            onSuccess();
            onClose();
        } catch (error) {
            console.error('Error creating patient profile:', error);
            alert('Failed to create patient profile. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="glass-card rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-blue-200">
                <div className="sticky top-0 bg-white/80 backdrop-blur-sm border-b border-blue-200 p-6 rounded-t-2xl">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-xl sm:text-2xl font-bold text-primary">Complete Your Registration</h2>
                            <p className="text-secondary text-sm sm:text-base">Please provide your details to access healthcare services</p>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="w-5 h-5 text-gray-500" />
                        </button>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                            <User className="w-5 h-5 mr-2" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Full Name *
                                </label>
                                <input
                                    type="text"
                                    name="fullName"
                                    value={formData.fullName}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.fullName ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Enter your full name"
                                />
                                {errors.fullName && <p className="text-red-500 text-sm mt-1">{errors.fullName}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Date of Birth *
                                </label>
                                <input
                                    type="date"
                                    name="dateOfBirth"
                                    value={formData.dateOfBirth}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.dateOfBirth ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                />
                                {errors.dateOfBirth && <p className="text-red-500 text-sm mt-1">{errors.dateOfBirth}</p>}
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
                                    Email Address *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.email ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="your.email@example.com"
                                />
                                {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Phone Number *
                                </label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.phoneNumber ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{errors.phoneNumber}</p>}
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Address *
                            </label>
                            <input
                                type="text"
                                name="address"
                                value={formData.address}
                                onChange={handleInputChange}
                                className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.address ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                placeholder="Your full address"
                            />
                            {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
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
                                    Emergency Contact Name *
                                </label>
                                <input
                                    type="text"
                                    name="emergencyContact"
                                    value={formData.emergencyContact}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.emergencyContact ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="Emergency contact full name"
                                />
                                {errors.emergencyContact && <p className="text-red-500 text-sm mt-1">{errors.emergencyContact}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Emergency Contact Phone *
                                </label>
                                <input
                                    type="tel"
                                    name="emergencyPhone"
                                    value={formData.emergencyPhone}
                                    onChange={handleInputChange}
                                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${errors.emergencyPhone ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    placeholder="+1 (555) 123-4567"
                                />
                                {errors.emergencyPhone && <p className="text-red-500 text-sm mt-1">{errors.emergencyPhone}</p>}
                            </div>
                        </div>
                    </div>

                    {/* Medical Information */}
                    <div>
                        <h3 className="text-lg font-semibold text-primary mb-4 flex items-center">
                            <MapPin className="w-5 h-5 mr-2" />
                            Medical Information (Optional)
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Medical History
                                </label>
                                <textarea
                                    name="medicalHistory"
                                    value={formData.medicalHistory}
                                    onChange={handleInputChange}
                                    rows={3}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any relevant medical history..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Allergies
                                </label>
                                <textarea
                                    name="allergies"
                                    value={formData.allergies}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Any known allergies..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Current Medications
                                </label>
                                <textarea
                                    name="currentMedications"
                                    value={formData.currentMedications}
                                    onChange={handleInputChange}
                                    rows={2}
                                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="Current medications you're taking..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                        >
                            {loading ? 'Creating Profile...' : 'Complete Registration'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}