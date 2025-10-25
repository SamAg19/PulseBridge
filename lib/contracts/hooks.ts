import { useReadContract, useWriteContract, useWatchContractEvent, useAccount, useChainId } from 'wagmi';
import { chains, DoctorRegistry, ConsultationEscrow, erc20Abi } from '../constants';
import { parseUnits, formatUnits } from 'viem';

export function useContractAddress(contractName: 'DoctorRegistry' | 'ConsultationEscrow' | 'PYUSD' | 'USDC' | 'USDT') {
  const chainId = useChainId();
  const address = chains[chainId]?.[contractName];
  if (!address) {
    console.warn(`No ${contractName} address found for chain ${chainId}`);
  }
  return address as `0x${string}` | undefined;
}

export function useRegisterDoctor() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const registerDoctor = async (params: {
    name: string;
    specialization: string;
    profileDescription: string;
    email: string;
    consultationFeePerHour: number; // in PYUSD (will be converted to wei)
    legalDocumentsIPFSHash: string;
  }) => {
    if (!doctorRegistryAddress) throw new Error('DoctorRegistry address not found');

    // Convert consultation fee to wei (6 decimals for PYUSD)
    const feeInWei = parseUnits(params.consultationFeePerHour.toString(), 6);

    return await writeContractAsync({
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'registerAsDoctor',
      args: [
        params.name,
        params.specialization,
        params.profileDescription,
        params.email,
        feeInWei,
        params.legalDocumentsIPFSHash,
      ],
    });
  };

  return { registerDoctor, isPending, error };
}

/**
 * Get doctor information by doctor ID
 */
export function useGetDoctor(doctorId?: number) {
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const { data, isLoading, error, refetch } = useReadContract({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'getDoctor',
    args: doctorId !== undefined ? [doctorId] : undefined,
    query: {
      enabled: !!doctorRegistryAddress && doctorId !== undefined,
    },
  });

  // Transform contract data to UI-friendly format
  const doctor = data ? {
    registrationId: Number(data.registrationId),
    doctorId: Number(data.doctorId),
    name: data.Name,
    specialization: data.specialization,
    profileDescription: data.profileDescription,
    email: data.email,
    walletAddress: data.doctorAddress,
    consultationFeePerHour: Number(formatUnits(data.consultationFeePerHour, 6)),
    legalDocumentsIPFSHash: data.legalDocumentsIPFSHash,
  } : undefined;

  return { doctor, isLoading, error, refetch };
}

/**
 * Get pending doctor information by wallet address
 */
export function useGetPendingDoctor(walletAddress?: `0x${string}`) {
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const { data, isLoading, error, refetch } = useReadContract({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'getPendingDoctor',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!doctorRegistryAddress && !!walletAddress,
    },
  });

  // status: 0 = PENDING, 1 = APPROVED, 2 = DENIED
  const statusMap = ['pending', 'approved', 'denied'] as const;

  const pendingDoctor = data ? {
    registrationId: Number(data[0].registrationId),
    doctorId: Number(data[0].doctorId),
    name: data[0].Name,
    specialization: data[0].specialization,
    profileDescription: data[0].profileDescription,
    email: data[0].email,
    walletAddress: data[0].doctorAddress,
    consultationFeePerHour: Number(formatUnits(data[0].consultationFeePerHour, 6)),
    legalDocumentsIPFSHash: data[0].legalDocumentsIPFSHash,
    status: statusMap[data[1]] || 'pending',
  } : undefined;

  return { pendingDoctor, isLoading, error, refetch };
}

/**
 * Get doctor ID from wallet address
 */
export function useGetDoctorID(walletAddress?: `0x${string}`) {
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const { data, isLoading, error } = useReadContract({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'getDoctorID',
    args: walletAddress ? [walletAddress] : undefined,
    query: {
      enabled: !!doctorRegistryAddress && !!walletAddress,
    },
  });

  return { doctorId: data ? Number(data) : undefined, isLoading, error };
}

/**
 * Get total number of registered doctors
 */
export function useGetTotalDoctors() {
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const { data, isLoading, error, refetch } = useReadContract({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    functionName: 'numDoctors',
    query: {
      enabled: !!doctorRegistryAddress,
    },
  });

  return { totalDoctors: data ? Number(data) : 0, isLoading, error, refetch };
}

/**
 * Get all approved doctors (by fetching each one)
 */
export function useGetAllDoctors() {
  const { totalDoctors, isLoading: loadingCount } = useGetTotalDoctors();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  // We'll need to fetch doctors individually since there's no "getAll" function
  // This is a simplified version - you might want to use a multicall for better performance
  const doctors: any[] = [];

  return { doctors, isLoading: loadingCount, error: null };
}

/**
 * Approve a pending doctor (admin only)
 */
export function useApproveDoctor() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const approveDoctor = async (doctorAddress: `0x${string}`) => {
    if (!doctorRegistryAddress) throw new Error('DoctorRegistry address not found');

    return await writeContractAsync({
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'approveDoctor',
      args: [doctorAddress],
    });
  };

  return { approveDoctor, isPending, error };
}

/**
 * Deny a pending doctor (admin only)
 */
export function useDenyDoctor() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  const denyDoctor = async (doctorAddress: `0x${string}`) => {
    if (!doctorRegistryAddress) throw new Error('DoctorRegistry address not found');

    return await writeContractAsync({
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'denyDoctor',
      args: [doctorAddress],
    });
  };

  return { denyDoctor, isPending, error };
}

// ==================== CONSULTATION ESCROW HOOKS ====================

/**
 * Create a new consultation session
 */
export function useCreateSession() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const createSession = async (params: {
    doctorId: number;
    consultationPayment: number; // in token units
    tokenAddress: `0x${string}`; // PYUSD, USDC, USDT, or ETH
    startTime: number; // Unix timestamp
    priceUpdateData: `0x${string}`; // For Pyth oracle
  }) => {
    if (!consultationEscrowAddress) throw new Error('ConsultationEscrow address not found');

    // Determine decimals based on token type
    // ETH uses 18 decimals, stablecoins use 6 decimals
    const decimals = params.tokenAddress === '0x0000000000000000000000000000000000000000' ? 18 : 6;
    const paymentInWei = parseUnits(params.consultationPayment.toString(), decimals);

    console.log('Creating session with:', {
      consultationPayment: params.consultationPayment,
      decimals,
      paymentInWei: paymentInWei.toString(),
      paymentInETH: params.tokenAddress === '0x0000000000000000000000000000000000000000'
        ? (Number(paymentInWei) / 1e18).toFixed(6) + ' ETH'
        : (Number(paymentInWei) / 1e6).toFixed(6) + ' tokens',
      tokenAddress: params.tokenAddress,
      priceUpdateDataLength: params.priceUpdateData.length,
    });

    return await writeContractAsync({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'createSession',
      args: [
        params.doctorId,
        paymentInWei,
        [params.priceUpdateData],
        params.tokenAddress,
        BigInt(params.startTime),
      ],
      // If paying with ETH, include value
      value: params.tokenAddress === '0x0000000000000000000000000000000000000000' ? paymentInWei : undefined,
      // Set reasonable gas limit to avoid exceeding network cap
      // Pyth oracle updates require more gas due to signature verification
      gas: BigInt(5000000), // 5M gas should be sufficient
    });
  };

  return { createSession, isPending, error };
}

/**
 * Get session details by session ID
 */
export function useGetSession(sessionId?: number) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const { data, isLoading, error, refetch } = useReadContract({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    functionName: 'getSession',
    args: sessionId !== undefined ? [BigInt(sessionId)] : undefined,
    query: {
      enabled: !!consultationEscrowAddress && sessionId !== undefined,
    },
  });

  const statusMap = ['active', 'completed'] as const;

  const session = data ? {
    sessionId: Number(data.sessionId),
    doctorId: Number(data.doctorId),
    patient: data.patient,
    pyusdAmount: Number(formatUnits(data.pyusdAmount, 6)),
    status: statusMap[data.status] || 'active',
    prescriptionIPFSHash: data.doctorPrescriptionIPFSHash,
    createdAt: Number(data.createdAt),
    startTime: Number(data.startTime),
  } : undefined;

  return { session, isLoading, error, refetch };
}

/**
 * Get all sessions for a patient
 */
export function useGetPatientSessions(patientAddress?: `0x${string}`) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const { data, isLoading, error, refetch } = useReadContract({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    functionName: 'getPatientSessions',
    args: patientAddress ? [patientAddress] : undefined,
    query: {
      enabled: !!consultationEscrowAddress && !!patientAddress,
    },
  });

  const sessionIds = data ? data.map((id: bigint) => Number(id)) : [];

  return { sessionIds, isLoading, error, refetch };
}

/**
 * Get all sessions for a doctor
 */
export function useGetDoctorSessions(doctorId?: number) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const { data, isLoading, error, refetch } = useReadContract({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    functionName: 'getDoctorSessions',
    args: doctorId !== undefined ? [doctorId] : undefined,
    query: {
      enabled: !!consultationEscrowAddress && doctorId !== undefined,
    },
  });

  const sessionIds = data ? data.map((id: bigint) => Number(id)) : [];

  return { sessionIds, isLoading, error, refetch };
}

/**
 * Release payment after session completion (doctor only)
 */
export function useReleasePayment() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const releasePayment = async (params: {
    sessionId: number;
    prescriptionIPFSHash: string;
  }) => {
    if (!consultationEscrowAddress) throw new Error('ConsultationEscrow address not found');

    return await writeContractAsync({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'releasePayment',
      args: [BigInt(params.sessionId), params.prescriptionIPFSHash],
    });
  };

  return { releasePayment, isPending, error };
}

/**
 * Rate a completed session (patient only)
 */
export function useRateSession() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const rateSession = async (params: {
    sessionId: number;
    rating: number; // 0-100
  }) => {
    if (!consultationEscrowAddress) throw new Error('ConsultationEscrow address not found');

    if (params.rating < 0 || params.rating > 100) {
      throw new Error('Rating must be between 0 and 100');
    }

    return await writeContractAsync({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'rateSession',
      args: [BigInt(params.sessionId), params.rating],
    });
  };

  return { rateSession, isPending, error };
}

/**
 * Get all ratings for a doctor
 */
export function useGetDoctorRatings(doctorId?: number) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  const { data, isLoading, error, refetch } = useReadContract({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    functionName: 'getDoctorRatings',
    args: doctorId !== undefined ? [doctorId] : undefined,
    query: {
      enabled: !!consultationEscrowAddress && doctorId !== undefined,
    },
  });

  const ratings = data ? data.map((rating: number) => Number(rating)) : [];
  const averageRating = ratings.length > 0
    ? ratings.reduce((a: number, b: number) => a + b, 0) / ratings.length
    : 0;

  return { ratings, averageRating, totalRatings: ratings.length, isLoading, error, refetch };
}

// ==================== ERC20 TOKEN HOOKS ====================

/**
 * Get PYUSD balance
 */
export function usePYUSDBalance(address?: `0x${string}`) {
  const pyusdAddress = useContractAddress('PYUSD');

  const { data, isLoading, error, refetch } = useReadContract({
    address: pyusdAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!pyusdAddress && !!address,
    },
  });

  const balance = data ? Number(formatUnits(data, 6)) : 0;

  return { balance, isLoading, error, refetch };
}

/**
 * Approve PYUSD spending
 */
export function useApprovePYUSD() {
  const { writeContractAsync, isPending, error } = useWriteContract();
  const pyusdAddress = useContractAddress('PYUSD');

  const approve = async (params: {
    spender: `0x${string}`;
    amount: number;
  }) => {
    if (!pyusdAddress) throw new Error('PYUSD address not found');

    const amountInWei = parseUnits(params.amount.toString(), 6);

    return await writeContractAsync({
      address: pyusdAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [params.spender, amountInWei],
    });
  };

  return { approve, isPending, error };
}

/**
 * Check PYUSD allowance
 */
export function usePYUSDAllowance(owner?: `0x${string}`, spender?: `0x${string}`) {
  const pyusdAddress = useContractAddress('PYUSD');

  const { data, isLoading, error, refetch } = useReadContract({
    address: pyusdAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!pyusdAddress && !!owner && !!spender,
    },
  });

  const allowance = data ? Number(formatUnits(data, 6)) : 0;

  return { allowance, isLoading, error, refetch };
}

/**
 * Generic ERC20 approve hook - works with any token
 */
export function useApproveERC20() {
  const { writeContractAsync, isPending, error } = useWriteContract();

  const approve = async (params: {
    tokenAddress: `0x${string}`;
    spender: `0x${string}`;
    amount: number;
    decimals?: number; // Default to 6 for stablecoins
  }) => {
    const decimals = params.decimals ?? 6;
    const amountInWei = parseUnits(params.amount.toString(), decimals);

    return await writeContractAsync({
      address: params.tokenAddress,
      abi: erc20Abi,
      functionName: 'approve',
      args: [params.spender, amountInWei],
    });
  };

  return { approve, isPending, error };
}

/**
 * Generic ERC20 allowance check - works with any token
 */
export function useERC20Allowance(
  tokenAddress?: `0x${string}`,
  owner?: `0x${string}`,
  spender?: `0x${string}`,
  decimals: number = 6
) {
  const { data, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'allowance',
    args: owner && spender ? [owner, spender] : undefined,
    query: {
      enabled: !!tokenAddress && !!owner && !!spender,
    },
  });

  const allowance = data ? Number(formatUnits(data, decimals)) : 0;

  return { allowance, isLoading, error, refetch };
}

// ==================== CONTRACT EVENT HOOKS ====================

/**
 * Watch for DoctorApproved events
 */
export function useWatchDoctorApproved(callback: (log: any) => void) {
  const doctorRegistryAddress = useContractAddress('DoctorRegistry');

  useWatchContractEvent({
    address: doctorRegistryAddress,
    abi: DoctorRegistry,
    eventName: 'DoctorApproved',
    onLogs(logs) {
      logs.forEach(callback);
    },
  });
}

/**
 * Watch for SessionCreated events
 */
export function useWatchSessionCreated(callback: (log: any) => void) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  useWatchContractEvent({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    eventName: 'SessionCreated',
    onLogs(logs) {
      logs.forEach(callback);
    },
  });
}

/**
 * Watch for PaymentReleased events
 */
export function useWatchPaymentReleased(callback: (log: any) => void) {
  const consultationEscrowAddress = useContractAddress('ConsultationEscrow');

  useWatchContractEvent({
    address: consultationEscrowAddress,
    abi: ConsultationEscrow,
    eventName: 'PaymentReleased',
    onLogs(logs) {
      logs.forEach(callback);
    },
  });
}
