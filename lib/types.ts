export interface DoctorProfile {
  email: string;
  fullName: string;
  specialization: string;
  licenseNumber: string;
  verificationStatus: 'pending' | 'approved' | 'rejected';
  createdAt: any;
  updatedAt: any;
}

export interface Task {
  doctorId: string;
  title: string;
  description: string;
  category: 'consultation' | 'procedure' | 'followup';
  duration: number;
  fee: number;
  currency: 'PYUSD';
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
  createdAt: any;
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
}
