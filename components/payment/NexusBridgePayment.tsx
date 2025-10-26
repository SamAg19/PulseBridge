'use client';

import { useState, useEffect } from 'react';
import { NexusProvider, BridgeButton } from '@avail-project/nexus-widgets';
import { sdk, initializeWithProvider } from '@/app/lib/nexus';
import { useWalletClient } from 'wagmi';

interface NexusBridgePaymentProps {
  chainId: number;
  selectedToken: string;
  convertedAmount: number;
}

export default function NexusBridgePayment({
  chainId,
  selectedToken,
  convertedAmount,
}: NexusBridgePaymentProps) {
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string>('');
  const [walletProvider, setWalletProvider] = useState<any>(null);
  const { data: walletClient } = useWalletClient();

  // Initialize wallet provider when walletClient is available
  useEffect(() => {
    const initializeProvider = async () => {
      if (!walletClient) return;

      try {
        // Get the provider from walletClient
        if (typeof window !== 'undefined' && window.ethereum) {
          setWalletProvider(window.ethereum);

          // Initialize SDK if not already initialized
          if (!sdk.isInitialized()) {
            await initializeWithProvider(window.ethereum);
          }
        }
      } catch (err) {
        console.error('Failed to initialize provider:', err);
      }
    };

    initializeProvider();
  }, [walletClient]);

  const handleBridgeClick = async (bridgeOnClick: () => void) => {
    try {
      setIsInitializing(true);
      setError('');

      // Initialize SDK if not already initialized
      if (!sdk.isInitialized()) {
        if (typeof window !== 'undefined' && window.ethereum) {
          await initializeWithProvider(window.ethereum);
        } else {
          setError('No wallet provider found. Please install MetaMask or another Web3 wallet.');
          setIsInitializing(false);
          return;
        }
      }

      setIsInitializing(false);

      // Call the bridge onClick handler (opens modal)
      bridgeOnClick();
    } catch (err: any) {
      console.error('Failed to initialize:', err);
      setError(`Failed: ${err.message}`);
      setIsInitializing(false);
    }
  };

  if (!walletProvider || !walletClient) {
    return (
      <div className="w-full px-6 py-3 bg-gray-100 text-gray-600 rounded-xl text-center">
        <div className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Connecting wallet...
        </div>
      </div>
    );
  }

  return (
    <NexusProvider config={{ network: 'testnet' }}>
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <BridgeButton
        prefill={{
          chainId: chainId as any,
          token: selectedToken as any,
          amount: convertedAmount,
        }}
      >
        {({ onClick, isLoading }: any) => (
          <button
            onClick={() => handleBridgeClick(onClick)}
            disabled={isLoading || isInitializing}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading || isInitializing ? (
              <div className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                {isInitializing ? 'Initializing...' : 'Processing Bridge...'}
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
    </NexusProvider>
  );
}
