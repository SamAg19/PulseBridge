'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';

interface PaymentSectionProps {
  task: Task;
  appointmentId: string | null;
  onPayment: () => void;
  isProcessing: boolean;
}

export default function PaymentSection({ task, appointmentId, onPayment, isProcessing }: PaymentSectionProps) {
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'crypto' | 'card'>('crypto');
  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const formatFee = (fee: number) => {
    return fee >= 1 ? `${fee} ETH` : `${(fee * 1000).toFixed(0)} mETH`;
  };

  const paymentMethods = [
    {
      id: 'crypto',
      name: 'Cryptocurrency',
      description: 'Pay with ETH or PYUSD',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
        </svg>
      ),
      available: true
    },
    {
      id: 'card',
      name: 'Credit/Debit Card',
      description: 'Pay with Visa, Mastercard, or American Express',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      available: false
    }
  ];

  return (
    <div className="p-8">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
          </svg>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h3>
        <p className="text-gray-600 mb-4">
          Your appointment has been created. Complete the payment to confirm your booking.
        </p>
        <div className="text-3xl font-bold text-blue-600 mb-2">{formatFee(task.fee)}</div>
      </div>

      {/* Payment Methods */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Method</h4>
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <div
              key={method.id}
              onClick={() => method.available && setSelectedPaymentMethod(method.id as 'crypto' | 'card')}
              className={`border rounded-xl p-4 transition-all cursor-pointer ${
                selectedPaymentMethod === method.id
                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                  : method.available
                  ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`p-2 rounded-lg mr-4 ${
                    selectedPaymentMethod === method.id
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {method.icon}
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">{method.name}</h5>
                    <p className="text-sm text-gray-600">{method.description}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  {!method.available && (
                    <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full mr-3">
                      Coming Soon
                    </span>
                  )}
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPaymentMethod === method.id
                      ? 'border-blue-500 bg-blue-500'
                      : 'border-gray-300'
                  }`}>
                    {selectedPaymentMethod === method.id && (
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Payment Details */}
      {selectedPaymentMethod === 'crypto' && (
        <div className="mb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cryptocurrency Payment</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white rounded-lg p-4 border border-blue-100">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-gray-800 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">ETH</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">Ethereum</h5>
                    <p className="text-sm text-gray-600">Native ETH payment</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{formatFee(task.fee)}</div>
                  <div className="text-sm text-gray-500">≈ ${(task.fee * 2500).toFixed(2)} USD</div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-4 border border-blue-100 opacity-60">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                    <span className="text-white text-xs font-bold">PY</span>
                  </div>
                  <div>
                    <h5 className="font-medium text-gray-900">PYUSD</h5>
                    <p className="text-sm text-gray-600">PayPal USD stablecoin</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-500">Coming Soon</div>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h6 className="font-medium text-yellow-800 mb-1">Payment Processing Notice</h6>
                  <p className="text-sm text-yellow-700">
                    Payment processing is currently bypassed for testing purposes. In production, this would integrate with smart contracts for secure escrow payments.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowPaymentDetails(!showPaymentDetails)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
            >
              {showPaymentDetails ? 'Hide' : 'Show'} Payment Details
              <svg className={`w-4 h-4 ml-1 transition-transform ${showPaymentDetails ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showPaymentDetails && (
              <div className="mt-4 p-4 bg-white rounded-lg border border-blue-100">
                <h6 className="font-medium text-gray-900 mb-3">How Payment Works</h6>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">1</span>
                    <p>Payment is held in escrow until consultation is completed</p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                    <p>Both parties verify meeting attendance after consultation</p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                    <p>Payment is released to doctor upon successful verification</p>
                  </div>
                  <div className="flex items-start">
                    <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                    <p>Prescription delivery (if applicable) triggers patient payment portion</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Security Features */}
      <div className="mb-8">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Security & Protection</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-green-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="font-medium text-green-800">Escrow Protection</span>
            </div>
            <p className="text-sm text-green-700">
              Your payment is held securely until consultation is verified complete
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              <span className="font-medium text-blue-800">Smart Contract</span>
            </div>
            <p className="text-sm text-blue-700">
              Automated payment release based on verified consultation completion
            </p>
          </div>

          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center mb-2">
              <svg className="w-5 h-5 text-purple-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="font-medium text-purple-800">Audit Trail</span>
            </div>
            <p className="text-sm text-purple-700">
              Complete transaction history and verification records maintained
            </p>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <div className="text-center">
        <button
          onClick={onPayment}
          disabled={isProcessing}
          className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isProcessing ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
              Processing Payment...
            </div>
          ) : (
            <div className="flex items-center justify-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Complete Payment & Book Appointment
            </div>
          )}
        </button>
        
        <p className="text-sm text-gray-500 mt-3">
          By completing payment, you agree to our terms of service and privacy policy
        </p>
      </div>
    </div>
  );
}