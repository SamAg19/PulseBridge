'use client';

import { useState } from 'react';
import { DoctorWithTasks } from '@/lib/types';
import DoctorModal from '@/components/DoctorModal';

interface DoctorCardProps {
  doctor: any;
}

export default function DoctorCard({ doctor }: DoctorCardProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const formatFee = (fee: number) => {
    return fee >= 1 ? `${fee} ETH` : `${(fee * 1000).toFixed(0)} mETH`;
  };

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <svg key={i} className="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    if (hasHalfStar) {
      stars.push(
        <svg key="half" className="w-4 h-4 text-yellow-400" viewBox="0 0 20 20">
          <defs>
            <linearGradient id="half-fill">
              <stop offset="50%" stopColor="currentColor" />
              <stop offset="50%" stopColor="transparent" />
            </linearGradient>
          </defs>
          <path fill="url(#half-fill)" d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
        </svg>
      );
    }

    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(
        <svg key={`empty-${i}`} className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      );
    }

    return stars;
  };

  const lowestFee = doctor.tasks.length > 0 
    ? Math.min(...doctor.tasks.map((task: any) => task.fee))
    : 0;

  return (
    <>
      <div 
        className="glass-card rounded-xl hover:shadow-xl transition-all duration-300 cursor-pointer border border-blue-200 group transform hover:scale-105"
        onClick={() => setIsModalOpen(true)}
      >
        <div className="p-6">
          {/* Doctor Header */}
          <div className="flex items-start space-x-4 mb-6">
            <div className="relative">
              {doctor.profilePicture ? (
                <img 
                  src={doctor.profilePicture} 
                  alt={doctor.fullName}
                  className="w-18 h-18 rounded-2xl object-cover border-3 border-white shadow-lg"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-lg">
                  {getInitials(doctor.fullName)}
                </div>
              )}
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h3 className="text-lg font-semibold text-primary truncate group-hover:text-blue-600 transition-colors">
                Dr. {doctor.fullName}
              </h3>
              <p className="text-sm text-blue-600 font-medium">{doctor.specialization}</p>
              <div className="flex items-center mt-1">
                <div className="flex items-center space-x-1">
                  {renderStars(doctor.rating || 0)}
                </div>
                <span className="ml-2 text-sm text-secondary">
                  {doctor.rating ? doctor.rating.toFixed(1) : '0.0'} ({doctor.totalReviews || 0} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* Doctor Info */}
          <div className="space-y-3 mb-4">
            {doctor.experience && (
              <div className="flex items-center text-sm text-secondary">
                <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {doctor.experience} years experience
              </div>
            )}
            
            <div className="flex items-center text-sm text-secondary">
              <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Available for consultation
            </div>

            <div className="flex items-center text-sm text-secondary">
              <svg className="w-4 h-4 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
              From {formatFee(lowestFee)}
            </div>
          </div>

          {/* Services Preview */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-primary mb-2">Available Services</h4>
            <div className="flex flex-wrap gap-1">
              {doctor.tasks.slice(0, 2).map((task: any, index: number) => (
                <span 
                  key={index}
                  className="inline-block px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded-full"
                >
                  {task.title}
                </span>
              ))}
              {doctor.tasks.length > 2 && (
                <span className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                  +{doctor.tasks.length - 2} more
                </span>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-all duration-200 transform group-hover:scale-[1.02]">
            View Profile & Book
          </button>
        </div>
      </div>

      <DoctorModal 
        doctor={doctor}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}