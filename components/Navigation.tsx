'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import PatientProfileModal from './PatientProfileModal';
import DoctorProfileModal from './DoctorProfileModal';
import { 
  Menu, 
  X, 
  Heart, 
  Calendar, 
  CreditCard, 
  Search,
  Settings,
  User,
  Stethoscope,
  UserCircle
} from 'lucide-react';

interface NavigationProps {
  userType: 'patient' | 'doctor' | 'admin';
}

export default function Navigation({ userType }: NavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const pathname = usePathname();

  const getNavigationItems = () => {
    switch (userType) {
      case 'patient':
        return [
          { href: '/patient', label: 'Find Doctors', icon: Search },
          { href: '/patient/appointments', label: 'My Appointments', icon: Calendar },
          { href: '/patient/payments', label: 'Payment History', icon: CreditCard },
        ];
      case 'doctor':
        return [
          { href: '/dashboard', label: 'Dashboard', icon: Settings },
          { href: '/dashboard/tasks', label: 'My Services', icon: Stethoscope },
          { href: '/dashboard/appointments', label: 'Appointments', icon: Calendar },
          { href: '/dashboard/payments', label: 'Payments', icon: CreditCard },
        ];
      case 'admin':
        return [
          { href: '/admin', label: 'Dashboard', icon: Settings },
          { href: '/admin/doctors', label: 'Doctor Verification', icon: User },
          { href: '/admin/attendance', label: 'Meeting Attendance', icon: Calendar },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems();

  const isActive = (href: string) => {
    return pathname === href || (href !== '/' && pathname.startsWith(href));
  };

  return (
    <header className="glass-card border-b border-blue-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <Heart className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-primary">HealthCare+</h1>
              <p className="text-xs text-secondary hidden sm:block">
                {userType === 'patient' && 'Patient Portal'}
                {userType === 'doctor' && 'Doctor Portal'}
                {userType === 'admin' && 'Admin Portal'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              const IconComponent = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-secondary hover:text-primary hover:bg-blue-50'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center space-x-4">
            {userType !== 'admin' && (
              <button
                onClick={() => setShowProfileModal(true)}
                className="p-2 rounded-lg text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
                title="View Profile"
              >
                <UserCircle className="w-6 h-6" />
              </button>
            )}
            {userType !== 'admin' && <ConnectButton />}
            {userType === 'admin' && (
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                Admin Access
              </span>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-blue-200 py-4">
            <nav className="space-y-2">
              {navigationItems.map((item) => {
                const IconComponent = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                      isActive(item.href)
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-secondary hover:text-primary hover:bg-blue-50'
                    }`}
                  >
                    <IconComponent className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            
            {/* Mobile Actions */}
            <div className="mt-4 pt-4 border-t border-blue-200">
              {userType !== 'admin' && (
                <div className="space-y-3">
                  <button
                    onClick={() => {
                      setShowProfileModal(true);
                      setIsMenuOpen(false);
                    }}
                    className="flex items-center space-x-3 px-4 py-3 w-full text-left rounded-lg text-sm font-medium text-secondary hover:text-primary hover:bg-blue-50 transition-colors"
                  >
                    <UserCircle className="w-5 h-5" />
                    <span>My Profile</span>
                  </button>
                  <div className="px-4">
                    <ConnectButton />
                  </div>
                </div>
              )}
              {userType === 'admin' && (
                <div className="px-4">
                  <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    Admin Access
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Profile Modals */}
      {userType === 'patient' && (
        <PatientProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
      
      {userType === 'doctor' && (
        <DoctorProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
        />
      )}
    </header>
  );
}