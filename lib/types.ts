// Contract-based doctor profile (fetched from DoctorRegistry)
export interface DoctorProfile {
  registrationId: number;
  doctorId: number; // On-chain ID
  name: string;
  email: string;
  specialization: string;
  profileDescription: string;
  walletAddress: string;
  consultationFeePerHour: number; // In PYUSD
  legalDocumentsIPFSHash: string;
  // Derived/computed fields
  rating?: number; // Computed from on-chain ratings
  totalReviews?: number; // Count of on-chain ratings
  verificationStatus: 'pending' | 'approved' | 'denied';
}

// Doctor availability timeslots (stored in Firebase)
// This is the ONLY thing stored off-chain for doctor services
export interface DoctorAvailability {
  id?: string;
  doctorId: number; // On-chain doctor ID
  walletAddress: string; // Doctor's wallet
  timeSlots: TimeSlot[];
  createdAt: any;
  updatedAt: any;
}

export interface TimeSlot {
  id?: string;
  date: string; // ISO date string (YYYY-MM-DD)
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isBooked?: boolean; // Whether this slot is already booked
}

// Session from smart contract (replaces Appointment)
export interface Session {
  sessionId: number;
  doctorId: number;
  patient: string; // Patient wallet address
  pyusdAmount: number; // Payment amount in PYUSD
  status: 'active' | 'completed';
  prescriptionIPFSHash?: string;
  createdAt: number; // Unix timestamp
  startTime: number; // Unix timestamp
  // Optional meeting data (could be stored separately if needed)
  meetingLink?: string;
  meetingId?: string;
}

// Payments are now handled entirely on-chain via ConsultationEscrow
// No separate Payment interface needed - use Session interface
// Payment is escrowed in the session and released by doctor with prescription
export interface PatientProfile {
  id?: string;
  email: string;
  fullName: string;
  walletAddress?: string;
  createdAt: any;
  updatedAt: any;
}

// Reviews are now on-chain ratings (0-100)
export interface Review {
  sessionId: number;
  doctorId: number;
  patientId: string; // wallet address
  rating: number; // 0-100 from contract
  // Note: comments would need to be stored separately (IPFS or Firebase) if needed
}

// Prescription data structure (stored on IPFS, hash on-chain)
export interface Prescription {
  sessionId: number;
  doctorId: number;
  patientAddress: string;
  medications: Medication[];
  instructions: string;
  notes?: string;
  createdAt: number; // Unix timestamp
  ipfsHash?: string; // Hash of this prescription stored on-chain
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

// Extended doctor profile with availability and ratings
export interface DoctorWithAvailability extends DoctorProfile {
  availability?: DoctorAvailability; // From Firebase
  ratings?: number[]; // From on-chain
  averageRating?: number;
}

// ==================== LEGACY TYPES (TO BE REMOVED) ====================
// These types are deprecated and should not be used in new code
// They exist only for backward compatibility during migration

/**
 * @deprecated This type is deprecated. Use DoctorAvailability instead.
 * Tasks are being replaced with on-chain doctor profiles + availability slots
 */
export interface Task {
  id?: string;
  doctorId: string;
  title: string;
  description: string;
  category: 'consultation' | 'procedure' | 'followup';
  duration: number;
  fee: number;
  currency: 'ETH' | 'PYUSD';
  status: 'draft' | 'published' | 'archived';
  dateTimeSlots: TimeSlot[];
  createdAt: any;
  publishedAt?: any;
}

/**
 * @deprecated Use Session interface instead (from smart contracts)
 */
export interface Appointment {
  doctorId: string;
  patientId: string;
  taskId: string;
  scheduledDate: any;
  scheduledTime: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  paymentStatus: 'pending_approval' | 'approved' | 'completed';
  paymentAmount: number;
  meetingLink?: string;
  meetingId?: string;
  attendanceTracking?: AttendanceTracking;
  verification?: MeetingVerification;
  prescriptionDelivered?: boolean;
  prescriptionVerified?: boolean;
  prescriptionVerificationTime?: any;
  createdAt: any;
}

export interface AttendanceTracking {
  doctorJoined: boolean;
  patientJoined: boolean;
  doctorJoinTime?: any;
  patientJoinTime?: any;
  meetingStartTime?: any;
  meetingEndTime?: any;
  meetingDuration?: number;
  bothParticipantsPresent: boolean;
}

export interface MeetingVerification {
  doctorVerified: boolean;
  patientVerified: boolean;
  doctorVerificationTime?: any;
  patientVerificationTime?: any;
  meetingStartTime?: any;
  meetingEndTime?: any;
}

export interface PaymentEscrowStatus {
  status: 'held' | 'released_to_doctor' | 'released_to_patient' | 'disputed';
  releaseConditions: {
    meetingVerified: boolean;
    prescriptionDelivered: boolean;
    prescriptionVerified: boolean;
  };
  releaseTimestamp?: any;
}

/**
 * @deprecated Payments are now handled on-chain via ConsultationEscrow contract
 */
export interface Payment {
  appointmentId: string;
  doctorId: string;
  patientId: string;
  amount: number;
  currency: 'PYUSD';
  status: 'pending_approval' | 'approved' | 'processing' | 'completed';
  approvalRequired: boolean;
  approvedBy?: string;
  approvedAt?: any;
  transactionHash?: string;
  escrowStatus?: PaymentEscrowStatus;
}

/**
 * @deprecated Use DoctorWithAvailability instead
 */
export interface DoctorWithTasks extends DoctorProfile {
  tasks: Task[];
  reviews: Review[];
}