'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAccount } from 'wagmi';
import Link from 'next/link';
import { registerDoctorWithWallet, checkDoctorRegistration } from '@/lib/firebase/auth';
import { DoctorProfile } from '@/lib/types';

export default function DoctorRegisterPage() {
    const { address, isConnected } = useAccount();
    const router = useRouter();
    const [formData, setFormData] = useState({
        fullName: '',
        specialization: '',
        licenseNumber: '',
        email: '',
        experience: '',
        bio: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
    const [currentStep, setCurrentStep] = useState(1);
    const totalSteps = 3;
    const [checkingRegistration, setCheckingRegistration] = useState(true);

    useEffect(() => {
        if (!isConnected) {
            router.push('/');
            return;
        }

        // Check if doctor is already registered
        const checkRegistration = async () => {
            if (address) {
                try {
                    const data = await checkDoctorRegistration(address);
                    if (data) {
                        if (data.verificationStatus === 'approved') {
                            router.push('/dashboard');
                        } else {
                            router.push('/doctor/pending');
                        }
                        return;
                    }
                } catch (error) {
                    // Doctor not registered, continue with registration
                    console.log('Doctor not registered, continuing with registration');
                }
            }
            setCheckingRegistration(false);
        };

        checkRegistration();
    }, [address, isConnected, router]);

    const validateField = (name: string, value: string): string => {
        switch (name) {
            case 'fullName':
                if (!value.trim()) return 'Full name is required';
                if (value.trim().length < 2) return 'Full name must be at least 2 characters';
                if (!/^[a-zA-Z\s.]+$/.test(value)) return 'Full name can only contain letters, spaces, and periods';
                return '';
            case 'email':
                if (!value.trim()) return 'Email address is required';
                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return 'Please enter a valid email address';
                return '';
            case 'specialization':
                if (!value.trim()) return 'Medical specialization is required';
                if (value.trim().length < 3) return 'Specialization must be at least 3 characters';
                return '';
            case 'licenseNumber':
                if (!value.trim()) return 'Medical license number is required';
                if (value.trim().length < 3) return 'License number must be at least 3 characters';
                return '';
            case 'experience':
                if (value && (isNaN(Number(value)) || Number(value) < 0 || Number(value) > 50)) {
                    return 'Experience must be a number between 0 and 50';
                }
                return '';

            default:
                return '';
        }
    };

    const validateStep = (step: number): boolean => {
        const errors: Record<string, string> = {};

        if (step === 1) {
            // Personal Information
            errors.fullName = validateField('fullName', formData.fullName);
            errors.email = validateField('email', formData.email);
        } else if (step === 2) {
            // Professional Information
            errors.specialization = validateField('specialization', formData.specialization);
            errors.licenseNumber = validateField('licenseNumber', formData.licenseNumber);
            errors.experience = validateField('experience', formData.experience);
        } else if (step === 3) {
            // Consultation Services - no required fields, just validate if filled
            // No validation needed for step 3 currently
        }

        // Remove empty errors
        Object.keys(errors).forEach(key => {
            if (!errors[key]) delete errors[key];
        });

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const nextStep = () => {
        if (validateStep(currentStep) && currentStep < totalSteps) {
            setCurrentStep(currentStep + 1);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleFieldChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });

        // Clear field error when user starts typing
        if (fieldErrors[field]) {
            setFieldErrors({ ...fieldErrors, [field]: '' });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!address) return;

        // Validate all steps
        let allValid = true;
        for (let step = 1; step <= totalSteps; step++) {
            if (!validateStep(step)) {
                allValid = false;
                setCurrentStep(step); // Go to first invalid step
                break;
            }
        }

        if (!allValid) return;

        setError('');
        setLoading(true);

        try {
            // Convert string fields to appropriate types
            const processedFormData = {
                ...formData,
                experience: formData.experience ? parseInt(formData.experience) : undefined,
            };

            // Remove undefined fields
            Object.keys(processedFormData).forEach(key => {
                if (processedFormData[key as keyof typeof processedFormData] === undefined) {
                    delete processedFormData[key as keyof typeof processedFormData];
                }
            });

            await registerDoctorWithWallet(address, processedFormData);
            router.push('/doctor/pending');
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (!isConnected) {
        return null;
    }

    if (checkingRegistration) {
        return (
            <div className="min-h-screen medical-gradient flex items-center justify-center">
                <div className="glass-card p-8 rounded-2xl">
                    <div className="text-primary text-xl font-medium">Checking registration status...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen medical-gradient py-12 px-4 relative overflow-hidden">
            {/* Animated background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
            </div>

            <div className="relative z-10 max-w-2xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8 animate-fadeInUp">
                    <div className="inline-flex items-center justify-center w-20 h-20 glass-effect rounded-full mb-6 shadow-lg">
                        <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h1 className="text-5xl font-bold text-primary mb-3">Doctor Registration</h1>
                    <p className="text-xl text-secondary font-medium">Complete your profile to get verified</p>
                    <p className="text-blue-600 mt-2 font-mono text-sm bg-white px-3 py-1 rounded-full inline-block">
                        Wallet: {address?.slice(0, 6)}...{address?.slice(-4)}
                    </p>
                </div>

                {/* Progress Bar */}
                <div className="mb-8">
                    <div className="flex items-center justify-center mb-6">
                        {[1, 2, 3].map((step) => (
                            <div key={step} className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all duration-300 ${step <= currentStep ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                                    }`}>
                                    {step}
                                </div>
                                {step < 3 && (
                                    <div className={`w-16 h-1 mx-2 rounded transition-all duration-300 ${step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                                        }`} />
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            {currentStep === 1 && 'Personal Information'}
                            {currentStep === 2 && 'Professional Credentials'}
                            {currentStep === 3 && 'Professional Profile'}
                        </h2>
                        <p className="text-secondary">
                            {currentStep === 1 && 'Tell us about yourself'}
                            {currentStep === 2 && 'Your medical credentials and experience'}
                            {currentStep === 3 && 'Complete your professional profile'}
                        </p>
                    </div>
                </div>

                {/* Main form card */}
                <div className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm animate-fadeInUp">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                </svg>
                                {error}
                            </div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Step 1: Personal Information */}
                        {currentStep === 1 && (
                            <div className="space-y-6 animate-fadeInUp">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="fullName" className="block text-sm font-semibold text-primary mb-2">
                                            Full Name <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="fullName"
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => handleFieldChange('fullName', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 ${fieldErrors.fullName ? 'border-red-300 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                                                }`}
                                            placeholder="Dr. John Smith"
                                            required
                                        />
                                        {fieldErrors.fullName && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {fieldErrors.fullName}
                                            </p>
                                        )}
                                        {!fieldErrors.fullName && (
                                            <p className="text-xs text-secondary mt-1">Enter your full name as it appears on your medical license</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="email" className="block text-sm font-semibold text-primary mb-2">
                                            Email Address <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="email"
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleFieldChange('email', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 ${fieldErrors.email ? 'border-red-300 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                                                }`}
                                            placeholder="doctor@example.com"
                                            required
                                        />
                                        {fieldErrors.email && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {fieldErrors.email}
                                            </p>
                                        )}
                                        {!fieldErrors.email && (
                                            <p className="text-xs text-secondary mt-1">Professional email address for patient communications</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Step 2: Professional Information */}
                        {currentStep === 2 && (
                            <div className="space-y-6 animate-fadeInUp">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div>
                                        <label htmlFor="specialization" className="block text-sm font-semibold text-primary mb-2">
                                            Medical Specialization <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="specialization"
                                            type="text"
                                            value={formData.specialization}
                                            onChange={(e) => handleFieldChange('specialization', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 ${fieldErrors.specialization ? 'border-red-300 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                                                }`}
                                            placeholder="e.g., Cardiology, Internal Medicine, Pediatrics"
                                            required
                                        />
                                        {fieldErrors.specialization && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {fieldErrors.specialization}
                                            </p>
                                        )}
                                        {!fieldErrors.specialization && (
                                            <p className="text-xs text-secondary mt-1">Your primary area of medical expertise</p>
                                        )}
                                    </div>

                                    <div>
                                        <label htmlFor="licenseNumber" className="block text-sm font-semibold text-primary mb-2">
                                            Medical License Number <span className="text-red-500">*</span>
                                        </label>
                                        <input
                                            id="licenseNumber"
                                            type="text"
                                            value={formData.licenseNumber}
                                            onChange={(e) => handleFieldChange('licenseNumber', e.target.value)}
                                            className={`w-full px-4 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 ${fieldErrors.licenseNumber ? 'border-red-300 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                                                }`}
                                            placeholder="MD123456"
                                            required
                                        />
                                        {fieldErrors.licenseNumber && (
                                            <p className="text-xs text-red-600 mt-1 flex items-center">
                                                <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                </svg>
                                                {fieldErrors.licenseNumber}
                                            </p>
                                        )}
                                        {!fieldErrors.licenseNumber && (
                                            <p className="text-xs text-secondary mt-1">Your valid medical license number for verification</p>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="experience" className="block text-sm font-semibold text-primary mb-2">
                                        Years of Experience
                                    </label>
                                    <input
                                        id="experience"
                                        type="number"
                                        min="0"
                                        max="50"
                                        value={formData.experience}
                                        onChange={(e) => handleFieldChange('experience', e.target.value)}
                                        className={`w-full px-4 py-4 bg-white border rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 ${fieldErrors.experience ? 'border-red-300 focus:ring-red-500' : 'border-blue-200 focus:ring-blue-500'
                                            }`}
                                        placeholder="5"
                                    />
                                    {fieldErrors.experience && (
                                        <p className="text-xs text-red-600 mt-1 flex items-center">
                                            <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                            </svg>
                                            {fieldErrors.experience}
                                        </p>
                                    )}
                                    {!fieldErrors.experience && (
                                        <p className="text-xs text-secondary mt-1">Total years of medical practice experience</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 3: Consultation Services */}
                        {currentStep === 3 && (
                            <div className="space-y-6 animate-fadeInUp">
                                <div>
                                    <label htmlFor="bio" className="block text-sm font-semibold text-primary mb-2">
                                        Professional Bio
                                    </label>
                                    <textarea
                                        id="bio"
                                        value={formData.bio}
                                        onChange={(e) => handleFieldChange('bio', e.target.value)}
                                        className="w-full px-4 py-4 bg-white border border-blue-200 rounded-xl text-gray-900 placeholder-gray-500 input-focus focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        rows={4}
                                        placeholder="Brief description of your medical background, expertise, and approach to patient care..."
                                    />
                                    <p className="text-xs text-secondary mt-1">Help patients understand your background and approach. You can set consultation fees when creating services later.</p>
                                </div>



                                {/* Registration Summary */}
                                <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
                                    <h3 className="font-semibold text-primary mb-4">Registration Summary</h3>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Name:</span>
                                            <span className="font-medium text-primary">{formData.fullName || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Email:</span>
                                            <span className="font-medium text-primary">{formData.email || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">Specialization:</span>
                                            <span className="font-medium text-primary">{formData.specialization || 'Not provided'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-secondary">License:</span>
                                            <span className="font-medium text-primary">{formData.licenseNumber || 'Not provided'}</span>
                                        </div>
                                        {formData.experience && (
                                            <div className="flex justify-between">
                                                <span className="text-secondary">Experience:</span>
                                                <span className="font-medium text-primary">{formData.experience} years</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Navigation Buttons */}
                        <div className="flex justify-between pt-6">
                            {currentStep > 1 ? (
                                <button
                                    type="button"
                                    onClick={prevStep}
                                    className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors font-medium"
                                >
                                    ← Previous
                                </button>
                            ) : (
                                <div></div>
                            )}

                            {currentStep < totalSteps ? (
                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300"
                                >
                                    Continue →
                                </button>
                            ) : (
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn-primary text-white font-semibold py-3 px-8 rounded-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {loading ? (
                                        <div className="flex items-center justify-center">
                                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Registering...
                                        </div>
                                    ) : (
                                        'Submit for Verification'
                                    )}
                                </button>
                            )}
                        </div>
                    </form>

                    <div className="mt-8 text-center">
                        <Link href="/" className="text-blue-600 hover:text-blue-800 transition-colors font-medium">
                            ← Back to home
                        </Link>
                    </div>
                </div>

                {/* Additional info */}
                <div className="text-center mt-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
                    <div className="glass-effect p-4 rounded-xl inline-block">
                        <p className="text-blue-600 text-sm font-medium">
                            🔒 Your information will be reviewed for verification within 24-48 hours
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}