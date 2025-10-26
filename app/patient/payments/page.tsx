'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAccount, useChainId, useConfig } from 'wagmi';
import { waitForTransactionReceipt } from '@wagmi/core';
import PythPriceFeeds, { PriceData } from '@/components/PythPriceFeeds';
import TokenSelector, { PaymentSecurityInfo } from '@/components/TokenSelector';
import { useCreateSession, useApproveERC20, useERC20Allowance } from '@/lib/contracts/hooks';
import { chains } from '@/lib/constants';
import { Calendar, Clock, User, DollarSign, ArrowLeft } from 'lucide-react';
import NexusBridgeAndExecutePayment from '@/components/payment/NexusBridgeAndExecutePayment';
import NexusBridgePayment from '@/components/payment/NexusBridgePayment';

type TokenType = 'PYUSD' | 'ETH' | 'USDC' | 'USDT';
type PaymentMethod = 'standard' | 'nexus';

export default function PatientPayments() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const config = useConfig();

  // Booking details from URL params
  const [bookingDetails, setBookingDetails] = useState({
    doctorId: 0,
    doctorName: '',
    specialization: '',
    fee: 0,
    slotDate: '',
    slotStartTime: '',
    slotEndTime: '',
  });

  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState<'approve' | 'create'>('approve');
  const [selectedToken, setSelectedToken] = useState<TokenType>('PYUSD');
  const [tokenPrices, setTokenPrices] = useState<PriceData[]>([]);
  const [priceUpdates, setPriceUpdates] = useState<any>(null);
  const [convertedAmount, setConvertedAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('standard');


  // Get token address based on selected token
  const getTokenAddress = (): `0x${string}` | undefined => {
    if (selectedToken === 'ETH') return undefined; // ETH doesn't need token address
    return chains[chainId]?.[selectedToken] as `0x${string}`;
  };

  const getTokenDecimals = (): number => {
    // ETH and most tokens use 18 decimals, stablecoins use 6
    return selectedToken === 'ETH' ? 18 : 6;
  };

  const { createSession, isPending: isCreatingSession } = useCreateSession();
  const { approve, isPending: isApproving } = useApproveERC20();
  const tokenAddress = getTokenAddress();
  const { allowance, refetch: refetchAllowance } = useERC20Allowance(
    tokenAddress,
    address,
    chains[chainId]?.ConsultationEscrow as `0x${string}`,
    getTokenDecimals()
  );

  useEffect(() => {
    if (!isConnected) {
      router.push('/patient');
      return;
    }

    // Parse URL params
    const doctorId = searchParams.get('doctorId');
    const doctorName = searchParams.get('doctorName');
    const specialization = searchParams.get('specialization');
    const fee = searchParams.get('fee');
    const slotDate = searchParams.get('slotDate');
    const slotStartTime = searchParams.get('slotStartTime');
    const slotEndTime = searchParams.get('slotEndTime');

    if (!doctorId || !fee || !slotDate || !slotStartTime) {
      router.push('/patient');
      return;
    }

    setBookingDetails({
      doctorId: parseInt(doctorId),
      doctorName: doctorName || '',
      specialization: specialization || '',
      fee: parseFloat(fee),
      slotDate: slotDate,
      slotStartTime: slotStartTime,
      slotEndTime: slotEndTime || '',
    });
  }, [searchParams, isConnected, router]);

  const handleApprove = async () => {
    try {
      setProcessing(true);
      setError('');

      const tokenAddr = getTokenAddress();
      if (!tokenAddr) {
        throw new Error('Token address not found');
      }

      const escrowAddress = chains[chainId]?.ConsultationEscrow as `0x${string}`;

      const txHash = await approve({
        tokenAddress: tokenAddr,
        spender: escrowAddress,
        amount: convertedAmount, // Use converted amount in selected token
        decimals: getTokenDecimals(),
      });

      // Wait for the approval transaction to be confirmed
      console.log('Waiting for approval transaction confirmation...');
      await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for 1 confirmation
      });
      console.log('Approval transaction confirmed!');

      // Refetch allowance to check if approved
      await refetchAllowance();
      setStep('create');
    } catch (err: any) {
      console.error('Approval error:', err);
      setError(`Failed to approve ${selectedToken}: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleCreateSession = async () => {
    try {
      setProcessing(true);
      setError('');

      // Convert start time to Unix timestamp
      const startDateTime = new Date(`${bookingDetails.slotDate}T${bookingDetails.slotStartTime}`);
      const startTimeUnix = Math.floor(startDateTime.getTime() / 1000);

      // Get token address based on selected token
      let tokenAddress: `0x${string}`;
      if (selectedToken === 'ETH') {
        tokenAddress = '0x0000000000000000000000000000000000000000'; // ETH is address(0)
      } else if (selectedToken === 'PYUSD') {
        tokenAddress = chains[chainId]?.PYUSD as `0x${string}`;
      } else if (selectedToken === 'USDC') {
        tokenAddress = chains[chainId]?.USDC as `0x${string}`;
      } else { // USDT
        tokenAddress = chains[chainId]?.USDT as `0x${string}`;
      }

      console.log(`0x${priceUpdates.binary.data[0]}`);
      const txHash = await createSession({
        doctorId: bookingDetails.doctorId,
        consultationPayment: convertedAmount, // Use converted amount in selected token
        priceUpdateData: `0x${priceUpdates.binary.data[0]}`,
        tokenAddress: tokenAddress,
        startTime: startTimeUnix,
      });

      // Wait for the session creation transaction to be confirmed
      console.log('Waiting for session creation transaction confirmation...');
      await waitForTransactionReceipt(config, {
        hash: txHash,
        confirmations: 1, // Wait for 1 confirmation
      });
      console.log('Session creation transaction confirmed!');

      // Success - redirect to appointments
      alert('Session created successfully! Redirecting to your appointments...');
      router.push('/patient/appointments');
    } catch (err: any) {
      console.error('Session creation error:', err);
      setError(`Failed to create session: ${err.message}`);
    } finally {
      setProcessing(false);
    }
  };

  // Handle price updates from Pyth
  const handlePricesUpdate = (prices: PriceData[], priceData: any) => {
    setTokenPrices(prices);
    console.log('Received price updates:', priceData);
    setPriceUpdates(priceData);
  };

  // Convert PYUSD fee to selected token
  useEffect(() => {
    if (bookingDetails.fee > 0 && tokenPrices.length > 0) {
      const pyusdPrice = tokenPrices.find(p => p.symbol === 'PyUSD')?.price || 1;

      if (selectedToken === 'PYUSD') {
        setConvertedAmount(bookingDetails.fee);
      } else {
        const selectedTokenPrice = tokenPrices.find(p => p.symbol === selectedToken)?.price;
        if (selectedTokenPrice) {
          // Convert: PYUSD fee * PYUSD price / selected token price
          const amountInUSD = bookingDetails.fee * pyusdPrice;
          const amountInSelectedToken = amountInUSD / selectedTokenPrice;
          setConvertedAmount(amountInSelectedToken + (0.01*amountInSelectedToken));
        }
      }
    }
  }, [bookingDetails.fee, selectedToken, tokenPrices]);

  // Check if already approved or if ETH (no approval needed)
  useEffect(() => {
    // ETH doesn't require approval
    if (selectedToken === 'ETH') {
      setStep('create');
      return;
    }

    // Check approval for ERC20 tokens
    if (convertedAmount > 0) {
      if (allowance >= convertedAmount) {
        setStep('create');
      } else {
        setStep('approve');
      }
    }
  }, [allowance, convertedAmount, selectedToken]);

  if (!bookingDetails.doctorId) {
    return (
      <div className="min-h-screen bg-light-blue flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-blue">
      {/* Header */}
      <header className="glass-card border-b border-blue-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <button
            onClick={() => router.push('/patient')}
            className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-4"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back to Doctors
          </button>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary">Complete Your Booking</h1>
            <p className="text-secondary mt-2">Review and pay for your consultation</p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Booking Summary */}
          <div className="lg:col-span-2 space-y-6">
            {/* Booking Details Card */}
            <div className="glass-card rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-semibold text-primary mb-4">Booking Details</h2>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <User className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Doctor</p>
                    <p className="font-semibold text-primary">{bookingDetails.doctorName}</p>
                    <p className="text-sm text-secondary">{bookingDetails.specialization}</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Calendar className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Date</p>
                    <p className="font-semibold text-primary">
                      {new Date(bookingDetails.slotDate).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <Clock className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Time</p>
                    <p className="font-semibold text-primary">
                      {bookingDetails.slotStartTime} - {bookingDetails.slotEndTime}
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <DollarSign className="w-5 h-5 text-blue-600 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm text-secondary">Consultation Fee</p>
                    <p className="text-2xl font-bold text-blue-600">{bookingDetails.fee} PYUSD</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Token Selector */}
            <TokenSelector
              selectedToken={selectedToken}
              onTokenSelect={setSelectedToken}
              convertedAmount={convertedAmount}
              consultationFee={bookingDetails.fee}
              tokenPrices={tokenPrices}
            />

            {/* Security Info */}
            <PaymentSecurityInfo />

            {/* Payment Method Selection */}
            <div className="glass-card rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-semibold text-primary mb-4">Choose Payment Method</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {/* Standard Payment Option */}
                <div
                  onClick={() => setPaymentMethod('standard')}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    paymentMethod === 'standard'
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-lg">💳</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Standard Payment</h3>
                        <p className="text-sm text-gray-600">Direct blockchain payment</p>
                      </div>
                    </div>
                    {paymentMethod === 'standard' && (
                      <div className="flex items-center justify-center w-6 h-6 bg-blue-600 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-13">
                    <li>• Pay with {selectedToken}</li>
                    <li>• Approve + Create Session</li>
                    <li>• Single chain transaction</li>
                  </ul>
                </div>

                {/* Nexus Bridge Payment Option */}
                <div
                  onClick={() => setPaymentMethod('nexus')}
                  className={`cursor-pointer rounded-xl p-4 border-2 transition-all ${
                    paymentMethod === 'nexus'
                      ? 'border-purple-500 bg-purple-50 ring-2 ring-purple-200'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full flex items-center justify-center mr-3">
                        <span className="text-white text-lg">🌉</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">Nexus Bridge And Execute</h3>
                        <p className="text-sm text-gray-600">Cross-chain payment</p>
                      </div>
                    </div>
                    {paymentMethod === 'nexus' && (
                      <div className="flex items-center justify-center w-6 h-6 bg-purple-600 rounded-full">
                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <ul className="text-xs text-gray-600 space-y-1 ml-13">
                    <li>• Bridge and Execute from any chain</li>
                    <li>• One-click payment</li>
                    <li>• Supports USDC, USDT</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Payment Actions */}
            <div className="glass-card rounded-2xl p-6 border border-blue-200">
              <h2 className="text-xl font-semibold text-primary mb-4">Complete Payment</h2>

              {error && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl">
                  {error}
                </div>
              )}

              {paymentMethod === 'nexus' && selectedToken !== 'PYUSD' && selectedToken !== 'ETH' ? (
                <NexusBridgeAndExecutePayment
                  doctorId={bookingDetails.doctorId}
                  consultationFee={convertedAmount > 0 ? convertedAmount : bookingDetails.fee}
                  selectedToken={selectedToken as 'USDC' | 'USDT'}
                  priceUpdateData={priceUpdates ? `0x${priceUpdates.binary.data[0]}` : '0x'}
                  startTime={Math.floor(new Date(`${bookingDetails.slotDate}T${bookingDetails.slotStartTime}`).getTime() / 1000)}
                  onSuccess={() => {
                    alert('Session created successfully! Redirecting to your appointments...');
                    router.push('/patient/appointments');
                  }}
                  onError={(err) => {
                    setError(`Nexus payment failed: ${err.message}`);
                  }}
                />
              ) : paymentMethod === 'nexus' && selectedToken === 'PYUSD' ? (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Nexus Bridge payment is not available for PYUSD. Please select ETH or another stablecoin (USDC or USDT) or use Standard Payment method.
                  </p>
                </div>
              ) : paymentMethod === 'nexus' && selectedToken === 'ETH' ? (
                <NexusBridgePayment
                  chainId={chainId}
                  selectedToken={selectedToken}
                  convertedAmount={convertedAmount}
                />
              ) : null}

              {paymentMethod === 'standard' && (
                <>
                  {step === 'approve' && selectedToken !== 'ETH' ? (
                    <div>
                      <p className="text-secondary mb-4">
                        First, approve {selectedToken} spending for the consultation escrow contract.
                      </p>
                      <button
                        onClick={handleApprove}
                        disabled={processing || isApproving}
                        className="w-full px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isApproving || processing ? (
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Approving...
                          </div>
                        ) : (
                          `Approve ${convertedAmount > 0 ? (selectedToken === 'PYUSD' ? convertedAmount.toFixed(2) : convertedAmount.toFixed(6)) : bookingDetails.fee} ${selectedToken}`
                        )}
                      </button>
                    </div>
                  ) : (
                    <div>
                  {selectedToken !== 'ETH' && (
                    <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl">
                      <p className="text-sm text-green-800">✓ {selectedToken} approved successfully</p>
                    </div>
                  )}
                  {selectedToken === 'ETH' && (
                    <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                      <p className="text-sm text-blue-800">ℹ ETH is the native token and doesn't require approval</p>
                    </div>
                  )}
                  <p className="text-secondary mb-4">
                    {selectedToken === 'ETH'
                      ? 'Create the consultation session and transfer ETH payment to escrow.'
                      : 'Now create the consultation session and transfer payment to escrow.'
                    }
                  </p>
                  <button
                    onClick={handleCreateSession}
                    disabled={processing || isCreatingSession}
                    className="w-full px-6 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCreatingSession || processing ? (
                      <div className="flex items-center justify-center">
                        <svg className="animate-spin h-5 w-5 mr-3" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing Payment...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Pay {convertedAmount > 0 ? (selectedToken === 'PYUSD' ? convertedAmount.toFixed(2) : convertedAmount.toFixed(6)) : bookingDetails.fee} {selectedToken} & Book Appointment
                      </div>
                    )}
                  </button>
                    <p className="text-sm text-gray-500 mt-3 text-center">
                      By completing payment, you agree to our terms of service and privacy policy
                    </p>
                  </div>
                )}
                </>
              )}
            </div>
          </div>

          {/* Right Column - Info */}
          <div className="lg:col-span-1">
            <div className="glass-card rounded-2xl p-6 border border-blue-200">
              <h2 className="text-lg font-semibold text-primary mb-4">Payment Information</h2>

              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-secondary mb-1">Original Fee (PYUSD)</p>
                  <p className="text-2xl font-bold text-blue-600">{bookingDetails.fee} PYUSD</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-secondary mb-1">Selected Token</p>
                  <p className="text-2xl font-bold text-green-600">{selectedToken}</p>
                </div>

                {selectedToken !== 'PYUSD' && convertedAmount > 0 && (
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <p className="text-sm text-secondary mb-1">Converted Amount</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {convertedAmount.toFixed(6)} {selectedToken}
                    </p>
                  </div>
                )}

                <div className="pt-4 border-t border-gray-200">
                  <p className="text-xs text-secondary">
                    💡 Prices are updated in real-time via Pyth Network oracle feeds
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Price Feed Component - Just for fetching prices */}
      <div className="hidden">
        <PythPriceFeeds onPricesUpdate={handlePricesUpdate} />
      </div>
    </div>
  );
}