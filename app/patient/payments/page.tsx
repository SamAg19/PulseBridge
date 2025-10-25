'use client';

import PythPriceFeeds from '@/components/PythPriceFeeds';

export default function PatientPayments() {
  return (
    <div className="min-h-screen bg-linear-to-br from-sky-50 to-sky-100">
      {/* Header */}
      <header className="glass-card border-b border-sky-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-sky-800">Live Crypto Prices</h1>
            <p className="text-sky-600 mt-2">Real-time cryptocurrency prices powered by Pyth Network</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PythPriceFeeds />
      </div>
    </div>
  );
}