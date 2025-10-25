import { readContract, readContracts } from '@wagmi/core';
import { config } from '../wagmi';
import { chains, DoctorRegistry, ConsultationEscrow } from '../constants';
import { formatUnits } from 'viem';
import { DoctorProfile, DoctorWithAvailability, Session } from '../types';
import { getBulkDoctorAvailability } from '../firebase/availability';

/**
 * Fetch all approved doctors from the contract
 * Since there's no "getAll" function, we fetch the total count and then fetch each doctor
 */
export async function getAllDoctors(chainId: number): Promise<DoctorProfile[]> {
  try {
    const doctorRegistryAddress = chains[chainId]?.DoctorRegistry as `0x${string}`;

    if (!doctorRegistryAddress) {
      throw new Error(`DoctorRegistry not deployed on chain ${chainId}`);
    }

    // Get total number of doctors
    const totalDoctors = await readContract(config, {
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'numDoctors',
    });

    const numDoctors = Number(totalDoctors);

    if (numDoctors === 0) {
      return [];
    }

    // Create array of doctor IDs (1-indexed in contract)
    const doctorIds = Array.from({ length: numDoctors }, (_, i) => i + 1);

    // Fetch all doctors in parallel using multicall
    const contracts = doctorIds.map((id) => ({
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'getDoctor' as const,
      args: [id],
    }));

    const results = await readContracts(config, { contracts });

    // Transform results to DoctorProfile format
    const doctors: DoctorProfile[] = results
      .map((result, index) => {
        if (result.status === 'success' && result.result) {
          const data = result.result as any;
          return {
            registrationId: Number(data.registrationId),
            doctorId: doctorIds[index],
            name: data.Name,
            email: data.email,
            specialization: data.specialization,
            profileDescription: data.profileDescription,
            walletAddress: data.doctorAddress,
            consultationFeePerHour: Number(formatUnits(data.consultationFeePerHour, 6)),
            legalDocumentsIPFSHash: data.legalDocumentsIPFSHash,
            verificationStatus: 'approved' as const, // All fetched doctors are approved
          };
        }
        return null;
      })
      .filter((doctor): doctor is DoctorProfile => doctor !== null);

    return doctors;
  } catch (error: any) {
    console.error('Error fetching all doctors:', error);
    throw new Error(`Failed to fetch doctors: ${error.message}`);
  }
}

/**
 * Fetch all doctors with their availability and ratings
 */
export async function getAllDoctorsWithAvailability(
  chainId: number
): Promise<DoctorWithAvailability[]> {
  try {
    // Fetch all doctors from contract
    const doctors = await getAllDoctors(chainId);

    if (doctors.length === 0) {
      return [];
    }

    const consultationEscrowAddress = chains[chainId]?.ConsultationEscrow as `0x${string}`;

    // Fetch availability from Firebase for all doctors
    const walletAddresses = doctors.map(d => d.walletAddress);
    const availabilityMap = await getBulkDoctorAvailability(walletAddresses);

    // Fetch ratings from contract for all doctors
    const ratingContracts = doctors.map((doctor) => ({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getDoctorRatings' as const,
      args: [doctor.doctorId],
    }));

    const ratingResults = await readContracts(config, { contracts: ratingContracts });

    // Combine all data
    const doctorsWithAvailability: DoctorWithAvailability[] = doctors.map((doctor, index) => {
      const availability = availabilityMap[doctor.walletAddress];

      let ratings: number[] = [];
      let averageRating = 0;
      let totalReviews = 0;

      if (ratingResults[index].status === 'success' && ratingResults[index].result) {
        ratings = (ratingResults[index].result as any[]).map((r: any) => Number(r));
        totalReviews = ratings.length;
        averageRating = totalReviews > 0
          ? ratings.reduce((a, b) => a + b, 0) / totalReviews
          : 0;
      }

      return {
        ...doctor,
        availability,
        ratings,
        averageRating,
        rating: averageRating, // For compatibility
        totalReviews,
      };
    });

    return doctorsWithAvailability;
  } catch (error: any) {
    console.error('Error fetching doctors with availability:', error);
    throw new Error(`Failed to fetch doctors with availability: ${error.message}`);
  }
}

/**
 * Fetch a single doctor with availability and ratings
 */
export async function getDoctorWithAvailability(
  chainId: number,
  doctorId: number
): Promise<DoctorWithAvailability | null> {
  try {
    const doctorRegistryAddress = chains[chainId]?.DoctorRegistry as `0x${string}`;
    const consultationEscrowAddress = chains[chainId]?.ConsultationEscrow as `0x${string}`;

    if (!doctorRegistryAddress || !consultationEscrowAddress) {
      throw new Error(`Contracts not deployed on chain ${chainId}`);
    }

    // Fetch doctor from contract
    const doctorData = await readContract(config, {
      address: doctorRegistryAddress,
      abi: DoctorRegistry,
      functionName: 'getDoctor',
      args: [doctorId],
    });

    if (!doctorData) {
      return null;
    }

    const doctor: DoctorProfile = {
      registrationId: Number(doctorData.registrationId),
      doctorId: Number(doctorData.doctorId),
      name: doctorData.Name,
      email: doctorData.email,
      specialization: doctorData.specialization,
      profileDescription: doctorData.profileDescription,
      walletAddress: doctorData.doctorAddress,
      consultationFeePerHour: Number(formatUnits(doctorData.consultationFeePerHour, 6)),
      legalDocumentsIPFSHash: doctorData.legalDocumentsIPFSHash,
      verificationStatus: 'approved',
    };

    // Fetch availability from Firebase
    const availabilityMap = await getBulkDoctorAvailability([doctor.walletAddress]);
    const availability = availabilityMap[doctor.walletAddress];

    // Fetch ratings from contract
    const ratingsData = await readContract(config, {
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getDoctorRatings',
      args: [doctorId],
    });

    const ratings = ratingsData ? (ratingsData as any[]).map((r: any) => Number(r)) : [];
    const totalReviews = ratings.length;
    const averageRating = totalReviews > 0
      ? ratings.reduce((a, b) => a + b, 0) / totalReviews
      : 0;

    return {
      ...doctor,
      availability,
      ratings,
      averageRating,
      rating: averageRating,
      totalReviews,
    };
  } catch (error: any) {
    console.error('Error fetching doctor with availability:', error);
    throw new Error(`Failed to fetch doctor: ${error.message}`);
  }
}

/**
 * Fetch all sessions for a patient and resolve with full session details
 */
export async function getPatientSessionsWithDetails(
  chainId: number,
  patientAddress: string
): Promise<Session[]> {
  try {
    const consultationEscrowAddress = chains[chainId]?.ConsultationEscrow as `0x${string}`;

    if (!consultationEscrowAddress) {
      throw new Error(`ConsultationEscrow not deployed on chain ${chainId}`);
    }

    // Get session IDs for patient
    const sessionIds = await readContract(config, {
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getPatientSessions',
      args: [patientAddress as `0x${string}`],
    });

    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    // Fetch all session details in parallel
    const sessionContracts = (sessionIds as bigint[]).map((id) => ({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getSession' as const,
      args: [id],
    }));

    const results = await readContracts(config, { contracts: sessionContracts });

    const statusMap = ['active', 'completed'] as const;

    const sessions: Session[] = results
      .map((result) => {
        if (result.status === 'success' && result.result) {
          const data = result.result as any;
          return {
            sessionId: Number(data.sessionId),
            doctorId: Number(data.doctorId),
            patient: data.patient,
            pyusdAmount: Number(formatUnits(data.pyusdAmount, 6)),
            status: statusMap[data.status] || 'active',
            prescriptionIPFSHash: data.doctorPrescriptionIPFSHash || undefined,
            createdAt: Number(data.createdAt),
            startTime: Number(data.startTime),
          };
        }
        return null;
      })
      .filter((session): session is Session => session !== null);

    return sessions;
  } catch (error: any) {
    console.error('Error fetching patient sessions:', error);
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }
}

/**
 * Fetch all sessions for a doctor and resolve with full session details
 */
export async function getDoctorSessionsWithDetails(
  chainId: number,
  doctorId: number
): Promise<Session[]> {
  try {
    const consultationEscrowAddress = chains[chainId]?.ConsultationEscrow as `0x${string}`;

    if (!consultationEscrowAddress) {
      throw new Error(`ConsultationEscrow not deployed on chain ${chainId}`);
    }

    // Get session IDs for doctor
    const sessionIds = await readContract(config, {
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getDoctorSessions',
      args: [doctorId],
    });

    if (!sessionIds || sessionIds.length === 0) {
      return [];
    }

    // Fetch all session details in parallel
    const sessionContracts = (sessionIds as bigint[]).map((id) => ({
      address: consultationEscrowAddress,
      abi: ConsultationEscrow,
      functionName: 'getSession' as const,
      args: [id],
    }));

    const results = await readContracts(config, { contracts: sessionContracts });

    const statusMap = ['active', 'completed'] as const;

    const sessions: Session[] = results
      .map((result) => {
        if (result.status === 'success' && result.result) {
          const data = result.result as any;
          return {
            sessionId: Number(data.sessionId),
            doctorId: Number(data.doctorId),
            patient: data.patient,
            pyusdAmount: Number(formatUnits(data.pyusdAmount, 6)),
            status: statusMap[data.status] || 'active',
            prescriptionIPFSHash: data.doctorPrescriptionIPFSHash || undefined,
            createdAt: Number(data.createdAt),
            startTime: Number(data.startTime),
          };
        }
        return null;
      })
      .filter((session): session is Session => session !== null);

    return sessions;
  } catch (error: any) {
    console.error('Error fetching doctor sessions:', error);
    throw new Error(`Failed to fetch sessions: ${error.message}`);
  }
}
