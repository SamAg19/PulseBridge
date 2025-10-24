'use client';

import { ReactNode } from 'react';
import Navigation from './Navigation';

interface ResponsiveLayoutProps {
  children: ReactNode;
  userType: 'patient' | 'doctor' | 'admin';
  title?: string;
  subtitle?: string;
}

export default function ResponsiveLayout({ 
  children, 
  userType, 
  title, 
  subtitle 
}: ResponsiveLayoutProps) {
  return (
    <div className="min-h-screen bg-light-blue">
      <Navigation userType={userType} />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {(title || subtitle) && (
          <div className="mb-6 sm:mb-8">
            {title && (
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary mb-2">
                {title}
              </h1>
            )}
            {subtitle && (
              <p className="text-base sm:text-lg text-secondary">
                {subtitle}
              </p>
            )}
          </div>
        )}
        
        <div className="space-y-6 sm:space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}