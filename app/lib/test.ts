import { NexusSDK } from '@avail-project/nexus-core';
import type {
  ExecuteParams,
  ExecuteResult,
  ExecuteSimulation,
  BridgeAndExecuteParams,
  BridgeAndExecuteResult,
  BridgeAndExecuteSimulationResult,
  SUPPORTED_TOKENS,
  SUPPORTED_CHAINS_IDS,
} from '@avail-project/nexus-core';
import { parseUnits } from 'viem';
import { useAccount, useBlockNumber, useChainId, useReadContract } from 'wagmi';
import { useApproveDoctor, useDenyDoctor, useContractAddress } from '@/lib/contracts/hooks';
import { DoctorRegistry, ConsultationEscrow, chains } from '@/lib/constants';

const sdk = new NexusSDK();
const chainId = useChainId();
let bridgeAndExecuteResult: BridgeAndExecuteResult;

    

async function  bridgeandConsultSession(consultationFeePayment: unknown, doctorID: unknown ): Promise<string> {
    if (chainId == 11155111) {
    const USDC = chains[421614]["USDC"]

  // Ethereum Sepolia - Bridge to Arbitrum Sepolia
  const ConsultEscrow = chains[421614]["ConsultationEscrow"];

  bridgeAndExecuteResult = await sdk.bridgeAndExecute({
    token: 'USDC',
    amount: '100000000', // 100 USDC (6 decimals)
    toChainId: 421614, // Arbitrum Sepolia
    sourceChains: [11155111], // Source from Ethereum Sepolia
    execute: {
      contractAddress: ConsultEscrow as `0x${string}`,
      contractAbi: [
        {
          inputs: [
            {
              internalType: 'uint32',
              name: 'doctorId',
              type: 'uint32',
            },
            {
              internalType: 'uint256',
              name: 'consultationPayment',
              type: 'uint256',
            },
            {
              internalType: 'bytes[]',
              name: 'priceUpdateData',
              type: 'bytes[]',
            },
            {
              internalType: 'address',
              name: 'tokenAddress',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'startTime',
              type: 'uint256',
            },
          ],
          name: 'createSession',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'createSession',
      buildFunctionParams: (
        token: SUPPORTED_TOKENS,
        amount: string,
        chainId: SUPPORTED_CHAINS_IDS,
        userAddress: `0x${string}`,
      ) => {
        const startTime = useBlockNumber

        return {
          functionParams: [
            doctorID, // doctorId (you should pass this as a parameter)
            consultationFeePayment, // consultationPayment
            [], // priceUpdateData (empty array for now)
            USDC, // tokenAddress
            startTime, // startTime
          ],
        };
      },
      tokenApproval: {
        token: 'USDC',
        amount: consultationFeePayment,
      },
    },
    waitForReceipt: true,
  } as BridgeAndExecuteParams);
} else if (chainId == 421614) {
      const USDC = chains[11155111]["USDC"]
  // Arbitrum Sepolia - Bridge to Ethereum Sepolia
  const ConsultEscrow = chains[11155111]["ConsultationEscrow"];

  bridgeAndExecuteResult = await sdk.bridgeAndExecute({
    token: 'USDC',
    amount: '100000000', // 100 USDC (6 decimals)
    toChainId: 11155111, // Ethereum Sepolia
    sourceChains: [421614], // Source from Arbitrum Sepolia
    execute: {
      contractAddress: ConsultEscrow as `0x${string}`,
      contractAbi: [
        {
          inputs: [
            {
              internalType: 'uint32',
              name: 'doctorId',
              type: 'uint32',
            },
            {
              internalType: 'uint256',
              name: 'consultationPayment',
              type: 'uint256',
            },
            {
              internalType: 'bytes[]',
              name: 'priceUpdateData',
              type: 'bytes[]',
            },
            {
              internalType: 'address',
              name: 'tokenAddress',
              type: 'address',
            },
            {
              internalType: 'uint256',
              name: 'startTime',
              type: 'uint256',
            },
          ],
          name: 'createSession',
          outputs: [],
          stateMutability: 'payable',
          type: 'function',
        },
      ],
      functionName: 'createSession',
      buildFunctionParams: (
        token: SUPPORTED_TOKENS,
        amount: string,
        chainId: SUPPORTED_CHAINS_IDS,
        userAddress: `0x${string}`,
      ) => {
        
        const startTime = useBlockNumber()
        return {
          functionParams: [
            doctorID, // doctorId (you should pass this as a parameter)
            consultationFeePayment, // consultationPayment
            [], // priceUpdateData (empty array for now)
            USDC, // tokenAddress
            startTime, // startTime
          ],
        };
      },
      tokenApproval: {
        token: 'USDC',
        amount: '100000000',
      },
    },
    waitForReceipt: true,
  } as BridgeAndExecuteParams);
}
return "hello"
}

