export interface DoctorProfile {
  id?: string;
  email: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  walletAddress?: string;
  profilePicture?: string;
  bio?: string;
  experience?: number;
  rating?: number;
  totalReviews?: number;
  consultationFee?: number;
  createdAt: any;
  updatedAt: any;
}

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

export interface TimeSlot {
  date: string;
  startTime: string;
  endTime: string;
}

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
  meetingDuration?: number; // in minutes
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
export interface PatientProfile {
  id?: string;
  email: string;
  fullName: string;
  walletAddress?: string;
  createdAt: any;
  updatedAt: any;
}

export interface Review {
  id?: string;
  doctorId: string;
  patientId: string;
  appointmentId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Prescription {
  id?: string;
  appointmentId: string;
  doctorId: string;
  patientId: string;
  medications: Medication[];
  instructions: string;
  notes?: string;
  createdAt: any;
}

export interface Medication {
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
  instructions?: string;
}

export interface DoctorWithTasks extends DoctorProfile {
  tasks: Task[];
  reviews: Review[];
}