'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import Link from 'next/link';

export default function HomePage() {
  const { isConnected } = useAccount();
  const [selectedRole, setSelectedRole] = useState<'doctor' | 'patient' | null>(null);

  if (!isConnected) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-400 opacity-10 rounded-full animate-float" style={{ animationDelay: '4s' }}></div>
        </div>

        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <div className="mb-8 animate-fadeInUp">
            <div className="inline-flex items-center justify-center w-24 h-24 glass-effect rounded-full mb-6 shadow-lg">
              <svg className="w-12 h-12 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <h1 className="text-6xl font-bold text-primary mb-4">
              Healthcare Platform
            </h1>
            <p className="text-xl text-secondary font-medium mb-8">
              Connect with verified doctors and manage appointments with crypto payments
            </p>
          </div>

          <div className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight">
            <h2 className="text-2xl font-bold text-primary mb-6">Connect Your Wallet to Get Started</h2>
            <p className="text-secondary mb-8">
              Secure, decentralized healthcare powered by blockchain technology
            </p>
            <div className="flex justify-center">
              <ConnectButton />
            </div>
          </div>

          <div className="text-center mt-6 animate-fadeInUp" style={{ animationDelay: '0.3s' }}>
            <p className="text-blue-600 text-sm font-medium">
              🔒 Secure • 🌐 Decentralized • 💊 Healthcare
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!selectedRole) {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center px-4 relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-200 opacity-20 rounded-full animate-float"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-300 opacity-15 rounded-full animate-float" style={{ animationDelay: '2s' }}></div>
        </div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="text-center mb-12 animate-fadeInUp">
            <h1 className="text-5xl font-bold text-primary mb-4">
              Choose Your Role
            </h1>
            <p className="text-xl text-secondary font-medium">
              How would you like to use our platform?
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div 
              onClick={() => setSelectedRole('doctor')}
              className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-primary mb-4">Doctor</h2>
                <p className="text-secondary mb-6">
                  Provide medical services, manage appointments, and receive crypto payments
                </p>
                <ul className="text-left text-secondary space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Create medical tasks & services
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Manage patient appointments
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Receive crypto payments
                  </li>
                </ul>
                <button className="w-full btn-primary text-white font-semibold py-3 rounded-xl transition-all duration-300">
                  Continue as Doctor
                </button>
              </div>
            </div>

            <div 
              onClick={() => setSelectedRole('patient')}
              className="glass-card rounded-2xl p-8 shadow-2xl animate-slideInRight cursor-pointer hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
              style={{ animationDelay: '0.2s' }}
            >
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-100 rounded-full mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-bold text-primary mb-4">Patient</h2>
                <p className="text-secondary mb-6">
                  Book appointments with verified doctors and pay securely with crypto
                </p>
                <ul className="text-left text-secondary space-y-2 mb-6">
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Browse verified doctors
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Book appointments easily
                  </li>
                  <li className="flex items-center">
                    <span className="text-blue-500 mr-2">✓</span>
                    Pay securely with crypto
                  </li>
                </ul>
                <Link
                  href="/patient"
                  className="block w-full btn-primary text-white font-semibold py-3 rounded-xl transition-all duration-300"
                >
                  Continue as Patient
                </Link>
                
                <div className="mt-4 text-center">
                  <Link
                    href="/admin"
                    className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    Admin Access
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="text-center mt-8">
            <div className="flex justify-center mb-4">
              <ConnectButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (selectedRole === 'doctor') {
    return (
      <div className="min-h-screen medical-gradient flex items-center justify-center px-4">
        <div className="max-w-md mx-auto text-center">
          <div className="glass-card rounded-2xl p-8 shadow-2xl">
            <h2 className="text-2xl font-bold text-primary mb-4">Doctor Registration</h2>
            <p className="text-secondary mb-6">
              Complete your profile to start providing medical services
            </p>
            <Link
              href="/doctor/register"
              className="block w-full btn-primary text-white font-semibold py-3 rounded-xl transition-all duration-300"
            >
              Complete Registration
            </Link>
            <button
              onClick={() => setSelectedRole(null)}
              className="mt-4 text-blue-600 hover:text-blue-800 transition-colors"
            >
              ← Back to role selection
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
