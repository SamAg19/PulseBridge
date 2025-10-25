'use client';

import { useState } from 'react';
import { Task } from '@/lib/types';
import { useCreateSession, useGetDoctor } from '@/lib/contracts/hooks';
import { useChainId, useConfig, useAccount, useWriteContract, useReadContract } from 'wagmi'
import { chains, ConsultationEscrow, erc20Abi } from "@/lib/constants"

import { readContract } from "@wagmi/core"

interface PaymentSectionProps {
  task: Task;
  appointmentId: string | null;
  doctorId: number;
  onPayment: () => void;
  isProcessing: boolean;
}

export default function PaymentSection({ task, appointmentId, doctorId, onPayment, isProcessing }: PaymentSectionProps) {
  const chainId = useChainId();
  const config = useConfig();
  const { address, isConnected } = useAccount();
  const [selectedToken, setSelectedToken] = useState<'PYUSD' | 'USDC' | 'USDT'>('PYUSD');
  const PYUSD = chains[chainId]["PYUSD"]
  const USDC = chains[chainId]["USDC"]
  const USDT = chains[chainId]["USDT"]
  const { writeContractAsync } = useWriteContract()
  // const { doctor } = useGetDoctor(doctorId);
  const ConsultEscrow = chains[chainId]["ConsultationEscrow"]

  const [showPaymentDetails, setShowPaymentDetails] = useState(false);

  const { createSession, isPending, isSuccess, error } = useCreateSession();

  const formatFee = (fee: number) => {
    return `$${fee.toFixed(2)} ${selectedToken}`;
  };

  const tokens = [
    {
      id: 'PYUSD',
      name: 'PayPal USD',
      symbol: 'PYUSD',
      description: 'PayPal stablecoin',
      icon: 'PY',
      available: true,
      color: 'bg-blue-600'
    },
    {
      id: 'USDC',
      name: 'USD Coin',
      symbol: 'USDC',
      description: 'Circle stablecoin',
      icon: 'UC',
      available: true,
      color: 'bg-indigo-600'
    },
    {
      id: 'USDT',
      name: 'Tether USD',
      symbol: 'USDT',
      description: 'Tether stablecoin',
      icon: 'UT',
      available: true,
      color: 'bg-green-600'
    }
  ];


  async function getApprovedToken(coin: string, consultationFee: number): Promise<void> {
    // Get current allowance
    const currentAllowance = await readContract(config, {
      abi: erc20Abi,
      address: coin as `0x${string}`,
      functionName: 'allowance',
      args: [address as `0x${string}`, ConsultEscrow as `0x${string}`]
    }) as bigint;


    var needToApprove
    // Convert fee to bigint with 6 decimals
    if (consultationFee > currentAllowance) {
      needToApprove = BigInt(consultationFee) - currentAllowance
    }



    // Only approve if current allowance is insufficient
    if (currentAllowance < consultationFee) {
      if (selectedToken === "USDC") {



        await writeContractAsync({
          abi: erc20Abi,
          address: USDC as `0x${string}`,
          functionName: "approve",
          args: [ConsultEscrow as `0x${string}`, BigInt(needToApprove)],
        });
      } else if (selectedToken === "USDT") {
        await writeContractAsync({
          abi: erc20Abi,
          address: USDT as `0x${string}`,
          functionName: "approve",
          args: [ConsultEscrow as `0x${string}`, needToApprove],
        });
      } else {
        await writeContractAsync({
          abi: erc20Abi,
          address: PYUSD as `0x${string}`,
          functionName: "approve",
          args: [ConsultEscrow as `0x${string}`, needToApprove],
        });
      }
    }
  }

  // In your component, call it like this:
  const { doctor } = useGetDoctor(doctorId);

  const handleApprove = async () => {
    if (doctor) {
      await getApprovedToken(selectedToken, doctor.consultationFeePerHour);
    }
  };

  const handlePayment = async () => {

  //   if (selectedToken == "ETH") {

  //   } else {
  //     await getApprovedToken(selectedToken)
  //   }

  //   // get the amount from here.
  // try {
  //   await createSession({
  //     doctorId: doctorId,
  //     consultationPayment: doctor.consultationFeePerHour,

  //     duration: task.duration,
  //     token: selectedToken
  //   });

  // If successful, call the onPayment callback
  //   if (isSuccess) {
  //     onPayment();
  //   }
  // } catch (err) {
  //   console.error('Payment error:', err);
  // }
};

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

    {/* Token Selection */}
    <div className="mb-8">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Choose Payment Token</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {tokens.map((token) => (
          <div
            key={token.id}
            onClick={() => token.available && setSelectedToken(token.id as 'PYUSD' | 'USDC' | 'USDT')}
            className={`border rounded-xl p-4 transition-all cursor-pointer ${selectedToken === token.id
              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
              : token.available
                ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                : 'border-gray-100 bg-gray-50 cursor-not-allowed opacity-60'
              }`}
          >
            <div className="flex items-center mb-3">
              <div className={`w-10 h-10 ${token.color} rounded-full flex items-center justify-center mr-3`}>
                <span className="text-white text-xs font-bold">{token.icon}</span>
              </div>
              <div>
                <h5 className="font-medium text-gray-900">{token.name}</h5>
                <p className="text-sm text-gray-600">{token.description}</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-lg font-bold text-gray-900">${task.fee.toFixed(2)}</div>
              <div className="text-sm text-gray-500">{token.symbol}</div>
            </div>
            {selectedToken === token.id && (
              <div className="mt-3 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-center text-sm text-blue-600">
                  <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  Selected
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {/* Error Display */}
    {error && (
      <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h6 className="font-medium text-red-800 mb-1">Payment Failed</h6>
            <p className="text-sm text-red-700">{error.message}</p>
          </div>
        </div>
      </div>
    )}

    {/* Payment Details */}
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h4 className="text-lg font-semibold text-gray-900 mb-4">Smart Contract Payment</h4>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          <div className="flex items-start">
            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h6 className="font-medium text-blue-800 mb-1">Secure Blockchain Payment</h6>
              <p className="text-sm text-blue-700">
                Your payment will be processed through our smart contract escrow system. Funds are held securely until consultation is completed.
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
                <p>Payment is held in escrow smart contract until consultation is completed</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">2</span>
                <p>Both parties verify meeting attendance after consultation</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">3</span>
                <p>Payment is automatically released to doctor upon successful verification</p>
              </div>
              <div className="flex items-start">
                <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold mr-3 mt-0.5 flex-shrink-0">4</span>
                <p>Transaction is recorded on blockchain for complete transparency</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>

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
            <span className="font-medium text-purple-800">Blockchain Audit</span>
          </div>
          <p className="text-sm text-purple-700">
            Complete transaction history recorded immutably on blockchain
          </p>
        </div>
      </div>
    </div>

    {/* Payment Button */}
    <div className="text-center">
      <button
        onClick={handlePayment}
        disabled={isPending || isProcessing}
        className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl hover:from-green-700 hover:to-green-800 transition-all font-semibold text-lg shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            Processing Payment...
          </div>
        ) : (
          <div className="flex items-center justify-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Pay {formatFee(task.fee)} & Book Appointment
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