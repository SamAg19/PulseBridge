'use client';

import { useEffect, useState, useRef } from 'react';
import { NexusProvider, BridgeButton, useNexus } from '@avail-project/nexus-widgets';

interface NexusBridgePaymentProps {
  chainId: number;
  selectedToken: string;
  convertedAmount: number;
}

function BridgeButtonInner({
  chainId,
  selectedToken,
  convertedAmount,
}: NexusBridgePaymentProps) {
  const { setProvider, initializeSdk, isSdkInitialized } = useNexus();
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<string>('');
  const initAttempted = useRef(false);

  useEffect(() => {
    // Skip if already initialized or already attempted
    if (isSdkInitialized || initAttempted.current) {
      setIsInitializing(false);
      return;
    }

    // Mark that we're attempting initialization
    initAttempted.current = true;

    const init = async () => {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          setProvider(window.ethereum);
          await initializeSdk(window.ethereum);
        } else {
          setError('Please connect your wallet first');
        }
      } catch (err: any) {
        console.error('Nexus init error:', err);
        setError(err.message || 'Failed to initialize');
      } finally {
        setIsInitializing(false);
      }
    };

    init();
  }, [isSdkInitialized, setProvider, initializeSdk]);

  if (isInitializing) {
    return (
      <div className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-center">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Initializing Nexus Bridge...
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <>
      <BridgeButton
        prefill={{
          chainId: chainId as any,
          token: selectedToken as any,
          amount: convertedAmount,
        }}
      >
        {({ onClick, isLoading }: any) => (
          <button
            onClick={onClick}
            disabled={isLoading || !isSdkInitialized}
            className="w-full px-6 py-3 bg-linear-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing Bridge...
              </div>
            ) : (
              `Bridge ${convertedAmount.toFixed(6)} ${selectedToken} to Sepolia`
            )}
          </button>
        )}
      </BridgeButton>

      <p className="text-xs text-center text-gray-500 mt-2">
        ⚠️ After bridging completes, please refresh the page and complete your booking using the standard payment method
      </p>
    </>
  );
}

export default function NexusBridgePayment(props: NexusBridgePaymentProps) {
  return (
    <NexusProvider config={{ network: 'testnet' }}>
      <BridgeButtonInner {...props} />
    </NexusProvider>
  );
}
