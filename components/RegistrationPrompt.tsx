'use client';

import { AlertCircle, X } from 'lucide-react';

interface RegistrationPromptProps {
  isVisible: boolean;
  onClose: () => void;
  onRegister: () => void;
}

export default function RegistrationPrompt({ isVisible, onClose, onRegister }: RegistrationPromptProps) {
  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="glass-card rounded-xl p-4 border border-orange-200 bg-orange-50/80 backdrop-blur-sm">
        <div className="flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-orange-800">Complete Your Registration</h3>
            <p className="text-xs text-orange-700 mt-1">
              Please complete your profile to book appointments and receive meeting links.
            </p>
            <div className="flex space-x-2 mt-3">
              <button
                onClick={onRegister}
                className="px-3 py-1.5 bg-orange-600 text-white text-xs rounded-lg hover:bg-orange-700 transition-colors"
              >
                Register Now
              </button>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-orange-600 text-xs hover:bg-orange-100 rounded-lg transition-colors"
              >
                Later
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-orange-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-orange-600" />
          </button>
        </div>
      </div>
    </div>
  );
}