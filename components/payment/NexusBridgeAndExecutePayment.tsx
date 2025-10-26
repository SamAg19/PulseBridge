'use client';

import { useState } from 'react';
import { sdk, initializeWithProvider, getUnifiedBalances } from '@/app/lib/nexus';
import { useAccount, useChainId } from 'wagmi';
import { chains } from '@/lib/constants';
import { parseUnits, formatUnits } from 'viem';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, CheckCircle2, AlertCircle, Wallet } from 'lucide-react';

interface NexusBridgeAndExecutePaymentProps {
  doctorId: number;
  consultationFee: number;
  selectedToken: 'ETH' | 'USDC' | 'USDT';
  startTime: number;
  priceUpdateData?: string;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

type PaymentStatus = 'idle' | 'bridging' | 'executing' | 'success' | 'error';

interface ChainBalance {
  chainId: number;
  chainName: string;
  balance: string;
}

export default function NexusBridgeAndExecutePayment({
  doctorId,
  consultationFee,
  selectedToken,
  startTime,
  priceUpdateData,
  onSuccess,
  onError,
}: NexusBridgeAndExecutePaymentProps) {
  const { address } = useAccount();
  const chainId = useChainId();
  const [status, setStatus] = useState<PaymentStatus>('idle');
  const [txHash, setTxHash] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [showBalances, setShowBalances] = useState(false);
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);
  const [balances, setBalances] = useState<ChainBalance[]>([]);

  const escrowAddress = chains[chainId]?.['ConsultationEscrow'];

  // Testnet chain IDs to names
  const chainIdToName: Record<number, string> = {
    11155420: 'Optimism Sepolia',
    80002: 'Polygon Amoy',
    421614: 'Arbitrum Sepolia',
    534351: 'Scroll Sepolia',
    84532: 'Base Sepolia',
    11155111: 'Ethereum Sepolia',
  };

  const handleFetchBalances = async () => {
    setIsLoadingBalances(true);
    setError('');

    try {
      // Initialize SDK if not already initialized
      if (!sdk.isInitialized()) {
        if (typeof window !== 'undefined' && window.ethereum) {
          await initializeWithProvider(window.ethereum);
        } else {
          setError('No wallet provider found. Please install MetaMask or another Web3 wallet.');
          setIsLoadingBalances(false);
          return;
        }
      }

      console.log('Fetching unified balances for token:', selectedToken);
      const unifiedBalances = await getUnifiedBalances();
      console.log('Raw Unified Balances Response:', JSON.stringify(unifiedBalances, null, 2));

      // Find the selected token's balances across chains
      const tokenBalances: ChainBalance[] = [];

      // The response is an array of token objects
      if (Array.isArray(unifiedBalances)) {
        console.log('Processing balances array...');

        // Find the token we're looking for
        const tokenData = unifiedBalances.find((token: any) => token.symbol === selectedToken);
        console.log(`Found ${selectedToken} data:`, tokenData);

        if (tokenData && tokenData.breakdown && Array.isArray(tokenData.breakdown)) {
          console.log(`Processing ${tokenData.breakdown.length} chains for ${selectedToken}`);

          tokenData.breakdown.forEach((chainData: any) => {
            const chainId = chainData.chain?.id;
            const balance = chainData.balance;
            const decimals = chainData.decimals || (selectedToken === 'ETH' ? 18 : 6);

            console.log(`Chain ${chainId}: balance=${balance}, decimals=${decimals}`);

            // Add all chains, even with zero balance
            tokenBalances.push({
              chainId: chainId,
              chainName: chainData.chain?.name || chainIdToName[chainId] || `Chain ${chainId}`,
              balance: parseFloat(balance || 0).toFixed(6),
            });
          });
        } else {
          console.warn(`No ${selectedToken} token found in response`);
        }
      } else {
        console.warn('Response is not an array:', unifiedBalances);
      }

      console.log('Final token balances:', tokenBalances);
      setBalances(tokenBalances);
      setShowBalances(true);
    } catch (err: any) {
      console.error('Failed to fetch unified balances:', err);
      setError(`Failed to fetch balances: ${err.message}`);
    } finally {
      setIsLoadingBalances(false);
    }
  };

  const handleBridgeAndExecute = async () => {
    // Initialize SDK if not already initialized
    if (!sdk.isInitialized()) {
      try {
        if (typeof window !== 'undefined' && window.ethereum) {
          await initializeWithProvider(window.ethereum);
        } else {
          setError('No wallet provider found. Please install MetaMask or another Web3 wallet.');
          setStatus('error');
          return;
        }
      } catch (err: any) {
        setError(`Failed to initialize Nexus SDK: ${err.message}`);
        setStatus('error');
        return;
      }
    }

    let tokenAddress: `0x${string}`;
    if (selectedToken === 'USDC') {
      tokenAddress = chains[chainId]?.USDC as `0x${string}`;
    } else { // USDT
      tokenAddress = chains[chainId]?.USDT as `0x${string}`;
    }

    if (!address || !escrowAddress || !tokenAddress) {
      setError('Missing required addresses');
      setStatus('error');
      return;
    }

    try {
      setStatus('bridging');
      setError('');

      // Convert fee to proper decimals (6 for stablecoins)
      const paymentAmount = parseUnits(consultationFee.toFixed(6), 6);
      setStatus('executing');


      // // Use Nexus SDK bridgeAndExecute
      // const result2 = await sdk.simulateBridgeAndExecute({
      //   token: selectedToken as any, // USDC, or USDT
      //   amount: paymentAmount.toString(),
      //   toChainId: chainId, // Target chain (Sepolia = 11155111)
      //   execute: {
      //     contractAddress: escrowAddress as `0x${string}`,
      //     contractAbi: ConsultationEscrowABI,
      //     functionName: 'createSession',
      //     buildFunctionParams: (token: any, amount: string | number | bigint | boolean, chainId: any, userAddress: any) => {
      //       const amountBigInt = typeof amount === 'bigint'
      //         ? amount
      //         : typeof amount === 'string'
      //           ? BigInt(amount.split('.')[0]) // Remove any decimals from string
      //           : BigInt(Math.floor(Number(amount)));
      //       return {
      //         functionParams: [
      //           doctorId,
      //           amountBigInt,
      //           [priceUpdateData],
      //           tokenAddress as `0x${string}`,
      //           BigInt(startTime),
      //         ],
      //       };
      //     },
      //     tokenApproval: {
      //       token: selectedToken as any,
      //       amount: paymentAmount.toString(),
      //     },
      //   },
      //   waitForReceipt: true,
      //   requiredConfirmations: 1,
      // } as any);




      // Use Nexus SDK bridgeAndExecute
      const result = await sdk.bridgeAndExecute({
        token: selectedToken as any, // USDC, or USDT
        amount: paymentAmount.toString(),
        toChainId: chainId, // Target chain (Sepolia = 11155111)
        execute: {
          contractAddress: escrowAddress as `0x${string}`,
          contractAbi: ConsultationEscrowABI,
          functionName: 'createSession',
          buildFunctionParams: (token: any, amount: string | number | bigint | boolean, chainId: any, userAddress: any) => {
            const amountBigInt = typeof amount === 'bigint'
              ? amount
              : typeof amount === 'string'
                ? BigInt(amount.split('.')[0]) // Remove any decimals from string
                : BigInt(Math.floor(Number(amount)));
            return {
              functionParams: [
                doctorId,
                amountBigInt,
                [priceUpdateData],
                tokenAddress as `0x${string}`,
                BigInt(startTime),
              ],
            };
          },
          tokenApproval: {
            token: selectedToken as any,
            amount: paymentAmount.toString(),
          },
        },
        waitForReceipt: true,
        requiredConfirmations: 1,
      } as any);

      if (result.success) {
        setTxHash(result.executeTransactionHash || result.bridgeTransactionHash || '');
        setStatus('success');
        console.log("succes!!", result);
        onSuccess?.();
      } else {
        console.log(result)
        throw new Error('Transaction failed');
      }
    } catch (err: any) {
      console.error('Bridge and execute error:', err);
      setError(err.message || 'Failed to process payment');
      setStatus('error');
      onError?.(err);
    }
  };

  const getStatusMessage = () => {
    switch (status) {
      case 'bridging':
        return 'Bridging funds across chains...';
      case 'executing':
        return 'Executing payment to escrow...';
      case 'success':
        return 'Payment successful!';
      case 'error':
        return 'Payment failed';
      default:
        return 'Ready to pay';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'bridging':
      case 'executing':
        return <Loader2 className="h-5 w-5 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <ArrowRight className="h-5 w-5" />;
    }
  };

  return (
    <div className="w-full rounded-lg border bg-white shadow-sm">
      <div className="flex flex-col space-y-1.5 p-6">
        <h3 className="text-2xl font-semibold leading-none tracking-tight flex items-center gap-2">
          <span className="text-2xl">🌉</span>
          Cross-Chain Payment
        </h3>
        <p className="text-sm text-gray-600">
          Bridge and pay for your consultation in one transaction using Avail Nexus
        </p>
      </div>
      <div className="p-6 pt-0 space-y-4">
        {/* Payment Details */}
        <div className="bg-linear-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-100">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Amount</span>
              <span className="font-semibold text-gray-900">
                {consultationFee.toFixed(2)} {selectedToken}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Payment Method</span>
              <span className="font-semibold text-gray-900">Nexus Bridge</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Status</span>
              <span className="flex items-center gap-2 text-sm font-medium">
                {getStatusIcon()}
                {getStatusMessage()}
              </span>
            </div>
          </div>
        </div>

        {/* How it works */}
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <h4 className="font-semibold text-purple-900 mb-2 flex items-center gap-2">
            <span>ℹ️</span>
            How Nexus Bridge Works
          </h4>
          <ul className="space-y-2 text-sm text-purple-800">
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">1.</span>
              <span>Funds are bridged from your current chain to the destination chain</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">2.</span>
              <span>Payment is automatically executed to the escrow contract</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="font-bold mt-0.5">3.</span>
              <span>All in one seamless transaction - no manual bridging needed!</span>
            </li>
          </ul>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <h6 className="font-medium text-red-800 mb-1">Payment Failed</h6>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Success Display */}
        {status === 'success' && txHash && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5 shrink-0" />
              <div className="flex-1">
                <h6 className="font-medium text-green-800 mb-1">Payment Successful!</h6>
                <p className="text-sm text-green-700 mb-2">
                  Your consultation has been booked and payment is secured in escrow.
                </p>
                <a
                  href={`https://sepolia.etherscan.io/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-green-600 hover:text-green-700 underline"
                >
                  View transaction →
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Unified Balances Display */}
        {showBalances && (
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-lg p-4">
            <h4 className="font-semibold text-indigo-900 mb-3 flex items-center gap-2">
              <Wallet className="h-5 w-5" />
              Your {selectedToken} Balances Across Chains
            </h4>
            {balances.length > 0 ? (
              <div className="space-y-2">
                {balances.map((chainBalance) => (
                  <div
                    key={chainBalance.chainId}
                    className="flex justify-between items-center bg-white rounded-md px-3 py-2"
                  >
                    <span className="text-sm font-medium text-gray-700">
                      {chainBalance.chainName}
                    </span>
                    <span className="text-sm font-bold text-indigo-600">
                      {chainBalance.balance} {selectedToken}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-600 text-center py-2">
                No {selectedToken} balances found across supported chains
              </p>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button
            onClick={handleFetchBalances}
            disabled={isLoadingBalances || status === 'bridging' || status === 'executing' || status === 'success'}
            variant="outline"
            className="flex-1 h-12 text-base font-semibold border-2"
            size="lg"
          >
            {isLoadingBalances ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Loading...
              </>
            ) : (
              <>
                <Wallet className="mr-2 h-4 w-4" />
                View Balances
              </>
            )}
          </Button>

          <Button
            onClick={handleBridgeAndExecute}
            disabled={status === 'bridging' || status === 'executing' || status === 'success'}
            className="flex-[2] h-12 text-base font-semibold"
            size="lg"
          >
            {status === 'bridging' || status === 'executing' ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Processing...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="mr-2 h-5 w-5" />
                Payment Complete
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-5 w-5" />
                Bridge & Pay {consultationFee.toFixed(2)} {selectedToken}
              </>
            )}
          </Button>
        </div>

        {/* Security Note */}
        <p className="text-xs text-center text-gray-500">
          🔒 Secured by Avail Nexus cross-chain infrastructure
        </p>
      </div>
    </div>
  );
}

// Consultation Escrow ABI for createSession function
const ConsultationEscrowABI = [
  {
    inputs: [
      { name: 'doctorId', type: 'uint32' },
      { name: 'consultationPayment', type: 'uint256' },
      { name: 'priceUpdateData', type: 'bytes[]' },
      { name: 'tokenAddress', type: 'address' },
      { name: 'startTime', type: 'uint256' },
    ],
    name: 'createSession',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
] as const;
