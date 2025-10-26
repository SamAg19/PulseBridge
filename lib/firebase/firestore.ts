import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  setDoc
} from 'firebase/firestore';
import { db } from './config';
import { Task, Appointment, Payment, MeetingVerification, PaymentEscrowStatus } from '../types';

// ============ TASKS ============
export const createTask = async (taskData: Omit<Task, 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'tasks'), {
      ...taskData,
      createdAt: serverTimestamp(),
    });
    return { success: true, taskId: docRef.id };
  } catch (error: any) {
    throw new Error(`Failed to create task: ${error.message}`);
  }
};

export const getTasksByDoctor = async (doctorId: string) => {
  try {
    const q = query(
      collection(db, 'tasks'),
      where('doctorId', '==', doctorId)
    );
    const querySnapshot = await getDocs(q);
    let tasks = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sort in memory instead of using Firestore orderBy
    tasks = tasks.sort((a: any, b: any) => {
      const aTime = a.createdAt?.toDate?.() || new Date(0);
      const bTime = b.createdAt?.toDate?.() || new Date(0);
      return bTime.getTime() - aTime.getTime(); // Descending order
    });

    return tasks;
  } catch (error: any) {
    throw new Error(`Failed to fetch tasks: ${error.message}`);
  }
};

export const updateTask = async (taskId: string, updates: Partial<Task>) => {
  try {
    await updateDoc(doc(db, 'tasks', taskId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update task: ${error.message}`);
  }
};

export const deleteTask = async (taskId: string) => {
  try {
    await deleteDoc(doc(db, 'tasks', taskId));
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to delete task: ${error.message}`);
  }
};

// ============ APPOINTMENTS ============
export const createAppointment = async (appointmentData: Omit<Appointment, 'createdAt'>) => {
  try {
    const docRef = await addDoc(collection(db, 'appointments'), {
      ...appointmentData,
      createdAt: serverTimestamp(),
    });
    return { success: true, appointmentId: docRef.id };
  } catch (error: any) {
    throw new Error(`Failed to create appointment: ${error.message}`);
  }
};

export const getAppointmentsByDoctor = async (doctorId: string) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('doctorId', '==', doctorId),
      orderBy('scheduledDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch appointments: ${error.message}`);
  }
};

export const updateAppointmentStatus = async (
  appointmentId: string,
  status: Appointment['status']
) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      status,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update appointment: ${error.message}`);
  }
};

// ============ PAYMENTS ============
export const createPayment = async (paymentData: Omit<Payment, 'createdAt'>) => {
  try {
    // Initialize escrow status for new payments
    const escrowStatus: PaymentEscrowStatus = {
      status: 'held',
      releaseConditions: {
        meetingVerified: false,
        prescriptionDelivered: false,
        prescriptionVerified: false
      }
    };

    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
      escrowStatus,
      createdAt: serverTimestamp(),
    });
    return { success: true, paymentId: docRef.id };
  } catch (error: any) {
    throw new Error(`Failed to create payment: ${error.message}`);
  }
};

export const getPaymentsByDoctor = async (doctorId: string) => {
  try {
    const q = query(
      collection(db, 'payments'),
      where('doctorId', '==', doctorId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch payments: ${error.message}`);
  }
};

export const updatePaymentStatus = async (
  paymentId: string,
  status: Payment['status'],
  approverUserId?: string
) => {
  try {
    const updates: any = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (status === 'approved' && approverUserId) {
      updates.approvedBy = approverUserId;
      updates.approvedAt = serverTimestamp();
    }

    await updateDoc(doc(db, 'payments', paymentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update payment: ${error.message}`);
  }
};

// ============ DOCTOR VERIFICATION ============
export const updateDoctorVerificationStatus = async (
  doctorId: string,
  status: 'pending' | 'approved' | 'rejected'
) => {
  try {
    await updateDoc(doc(db, 'doctors', doctorId), {
      verificationStatus: status,
      verifiedAt: status === 'approved' ? serverTimestamp() : null,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update verification status: ${error.message}`);
  }
};

export const getAllDoctors = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'doctors'));
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error: any) {
    throw new Error(`Failed to fetch doctors: ${error.message}`);
  }
};

// ============ DOCTOR PROFILE ============
export const updateDoctorProfile = async (doctorId: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'doctors', doctorId), {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update profile: ${error.message}`);
  }
};

export const getDoctorProfile = async (doctorId: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'doctors', doctorId));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    } else {
      throw new Error('Doctor profile not found');
    }
  } catch (error: any) {
    throw new Error(`Failed to fetch profile: ${error.message}`);
  }
};

export const getVerifiedDoctorsWithTasks = async (page: number = 1, limit: number = 6) => {
  try {
    // Get verified doctors
    const doctorsQuery = query(
      collection(db, 'doctors'),
      where('verificationStatus', '==', 'approved')
    );
    const doctorsSnapshot = await getDocs(doctorsQuery);
    const doctors = doctorsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Get tasks for each doctor
    const doctorsWithTasks = await Promise.all(
      doctors.map(async (doctor: any) => {
        const tasksQuery = query(
          collection(db, 'tasks'),
          where('doctorId', '==', doctor.id),
          where('status', '==', 'published')
        );
        const tasksSnapshot = await getDocs(tasksQuery);
        const tasks = tasksSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        // Get reviews for rating calculation
        const reviewsQuery = query(
          collection(db, 'reviews'),
          where('doctorId', '==', doctor.id)
        );
        const reviewsSnapshot = await getDocs(reviewsQuery);
        const reviews = reviewsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as any[];

        // Calculate average rating
        const avgRating = reviews.length > 0
          ? reviews.reduce((sum: number, review: any) => sum + review.rating, 0) / reviews.length
          : 0;

        return {
          ...doctor,
          tasks,
          reviews,
          rating: avgRating,
          totalReviews: reviews.length
        } as any;
      })
    );

    // Filter doctors who have published tasks
    const activeDoctors = doctorsWithTasks.filter((doctor: any) => doctor.tasks.length > 0);

    // Implement pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDoctors = activeDoctors.slice(startIndex, endIndex);

    return {
      doctors: paginatedDoctors,
      totalPages: Math.ceil(activeDoctors.length / limit),
      currentPage: page,
      totalDoctors: activeDoctors.length
    };
  } catch (error: any) {
    throw new Error(`Failed to fetch doctors: ${error.message}`);
  }
};

export const getDoctorById = async (doctorId: string) => {
  try {
    const doctorDoc = await getDoc(doc(db, 'doctors', doctorId));
    if (!doctorDoc.exists()) {
      throw new Error('Doctor not found');
    }

    const doctor = { id: doctorDoc.id, ...doctorDoc.data() } as any;

    // Get doctor's tasks
    const tasksQuery = query(
      collection(db, 'tasks'),
      where('doctorId', '==', doctorId),
      where('status', '==', 'published')
    );
    const tasksSnapshot = await getDocs(tasksQuery);
    const tasks = tasksSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    // Get reviews
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('doctorId', '==', doctorId)
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];

    return {
      ...doctor,
      tasks,
      reviews
    } as any;
  } catch (error: any) {
    throw new Error(`Failed to fetch doctor: ${error.message}`);
  }
};

export const getAppointmentsByPatient = async (patientId: string) => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('patientId', '==', patientId),
      orderBy('scheduledDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch patient appointments: ${error.message}`);
  }
};

export const createReview = async (reviewData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'reviews'), {
      ...reviewData,
      createdAt: serverTimestamp(),
    });
    return { success: true, reviewId: docRef.id };
  } catch (error: any) {
    throw new Error(`Failed to create review: ${error.message}`);
  }
};

export const getTaskById = async (taskId: string) => {
  try {
    const taskDoc = await getDoc(doc(db, 'tasks', taskId));
    if (!taskDoc.exists()) {
      throw new Error('Task not found');
    }
    return { id: taskDoc.id, ...taskDoc.data() };
  } catch (error: any) {
    throw new Error(`Failed to fetch task: ${error.message}`);
  }
};

// ============ ATTENDANCE TRACKING ============
export const updateAttendanceTracking = async (
  appointmentId: string,
  attendanceData: any
) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      attendanceTracking: attendanceData,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update attendance: ${error.message}`);
  }
};

export const markParticipantJoined = async (
  appointmentId: string,
  participantType: 'doctor' | 'patient'
) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentDoc.data();
    const currentTracking = appointment.attendanceTracking || {
      doctorJoined: false,
      patientJoined: false,
      bothParticipantsPresent: false
    };

    const updates: any = {
      [`attendanceTracking.${participantType}Joined`]: true,
      [`attendanceTracking.${participantType}JoinTime`]: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    // Check if both participants are now present
    const bothPresent = participantType === 'doctor'
      ? currentTracking.patientJoined
      : currentTracking.doctorJoined;

    if (bothPresent) {
      updates['attendanceTracking.bothParticipantsPresent'] = true;
      updates['attendanceTracking.meetingStartTime'] = serverTimestamp();
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to mark participant joined: ${error.message}`);
  }
};

export const completeMeeting = async (appointmentId: string) => {
  try {
    await updateDoc(doc(db, 'appointments', appointmentId), {
      'attendanceTracking.meetingEndTime': serverTimestamp(),
      status: 'completed',
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to complete meeting: ${error.message}`);
  }
};

// ============ PRESCRIPTIONS ============
export const createPrescription = async (prescriptionData: any) => {
  try {
    const docRef = await addDoc(collection(db, 'prescriptions'), {
      ...prescriptionData,
      createdAt: serverTimestamp(),
    });
    return { success: true, prescriptionId: docRef.id };
  } catch (error: any) {
    throw new Error(`Failed to create prescription: ${error.message}`);
  }
};

export const getPrescriptionsByPatient = async (patientId: string) => {
  try {
    const q = query(
      collection(db, 'prescriptions'),
      where('patientId', '==', patientId),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch prescriptions: ${error.message}`);
  }
};

export const getPrescriptionsByAppointment = async (appointmentId: string) => {
  try {
    const q = query(
      collection(db, 'prescriptions'),
      where('appointmentId', '==', appointmentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch appointment prescriptions: ${error.message}`);
  }
};

// ============ REVIEWS ============
export const getReviewsByAppointment = async (appointmentId: string) => {
  try {
    const q = query(
      collection(db, 'reviews'),
      where('appointmentId', '==', appointmentId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch appointment reviews: ${error.message}`);
  }
};

// ============ ADMIN OPERATIONS ============
export const getAllAppointments = async () => {
  try {
    const q = query(
      collection(db, 'appointments'),
      orderBy('scheduledDate', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch all appointments: ${error.message}`);
  }
};

export const updateAppointmentMeetingLink = async (
  appointmentId: string,
  meetingLink: string,
  meetingId?: string
) => {
  try {
    const updates: any = {
      meetingLink,
      updatedAt: serverTimestamp(),
    };

    // Only add meetingId and update status if meetingId is provided
    if (meetingId) {
      updates.meetingId = meetingId;
      updates.status = 'confirmed';
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update meeting link: ${error.message}`);
  }
};

export const getConfirmedAppointments = async () => {
  try {
    const q = query(
      collection(db, 'appointments'),
      where('status', '==', 'confirmed'),
      orderBy('scheduledDate', 'asc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch confirmed appointments: ${error.message}`);
  }
};

// ============ PATIENT PROFILES ============
export interface PatientProfile {
  walletAddress: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  dateOfBirth: string;
  address: string;
  emergencyContact: string;
  emergencyPhone: string;
  medicalHistory?: string;
  allergies?: string;
  currentMedications?: string;
  registrationDate: Date;
  isActive: boolean;
}

export const createPatientProfile = async (walletAddress: string, profileData: Omit<PatientProfile, 'walletAddress'>) => {
  try {
    const docRef = doc(db, 'patients', walletAddress);
    await updateDoc(docRef, {
      ...profileData,
      walletAddress,
      registrationDate: serverTimestamp(),
    });
    return { success: true, patientId: walletAddress };
  } catch (error: any) {
    // If document doesn't exist, create it using setDoc
    try {
      const docRef = doc(db, 'patients', walletAddress);
      await setDoc(docRef, {
        ...profileData,
        walletAddress,
        registrationDate: serverTimestamp(),
      });
      return { success: true, patientId: walletAddress };
    } catch (createError: any) {
      throw new Error(`Failed to create patient profile: ${createError.message}`);
    }
  }
};

export const getPatientProfile = async (walletAddress: string): Promise<PatientProfile | null> => {
  try {
    const docRef = doc(db, 'patients', walletAddress);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return {
        ...docSnap.data(),
        registrationDate: docSnap.data().registrationDate?.toDate() || new Date(),
      } as PatientProfile;
    }

    // If not found by document ID, try querying by walletAddress field
    const q = query(
      collection(db, 'patients'),
      where('walletAddress', '==', walletAddress)
    );
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return {
        ...doc.data(),
        registrationDate: doc.data().registrationDate?.toDate() || new Date(),
      } as PatientProfile;
    }

    return null;
  } catch (error: any) {
    console.error('Error fetching patient profile:', error);
    return null;
  }
};

export const updatePatientProfile = async (walletAddress: string, updates: Partial<PatientProfile>) => {
  try {
    const docRef = doc(db, 'patients', walletAddress);
    await updateDoc(docRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update patient profile: ${error.message}`);
  }
};

export const checkPatientExists = async (walletAddress: string): Promise<boolean> => {
  try {
    const profile = await getPatientProfile(walletAddress);
    return profile !== null;
  } catch (error) {
    return false;
  }
};

// ============ MEETING VERIFICATION ============
export const updateMeetingVerification = async (
  appointmentId: string,
  participantType: 'doctor' | 'patient',
  verified: boolean
) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentDoc.data();
    const currentVerification = appointment.verification || {
      doctorVerified: false,
      patientVerified: false
    };

    const updates: any = {
      [`verification.${participantType}Verified`]: verified,
      updatedAt: serverTimestamp(),
    };

    if (verified) {
      updates[`verification.${participantType}VerificationTime`] = serverTimestamp();
    }

    // Check if both participants have verified
    const bothVerified = participantType === 'doctor'
      ? verified && currentVerification.patientVerified
      : verified && currentVerification.doctorVerified;

    if (bothVerified) {
      // Update payment status to trigger escrow release
      updates.paymentStatus = 'completed';
      
      // Release payment to doctor via escrow system
      try {
        await updatePaymentEscrowStatus(appointmentId, 'meeting_verified');
      } catch (escrowError) {
        console.error('Failed to update payment escrow:', escrowError);
        // Continue with appointment update even if escrow fails
      }
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true, bothVerified };
  } catch (error: any) {
    throw new Error(`Failed to update meeting verification: ${error.message}`);
  }
};

export const getMeetingVerificationStatus = async (appointmentId: string) => {
  try {
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }

    const appointment = appointmentDoc.data();
    return appointment.verification || {
      doctorVerified: false,
      patientVerified: false
    };
  } catch (error: any) {
    throw new Error(`Failed to get verification status: ${error.message}`);
  }
};

export const updatePrescriptionVerification = async (
  appointmentId: string,
  verified: boolean
) => {
  try {
    const updates: any = {
      prescriptionVerified: verified,
      prescriptionDelivered: verified, // If verified, it means it was delivered
      updatedAt: serverTimestamp(),
    };

    if (verified) {
      updates.prescriptionVerificationTime = serverTimestamp();
      
      // Release patient payment via escrow system
      try {
        await updatePaymentEscrowStatus(appointmentId, 'prescription_verified');
      } catch (escrowError) {
        console.error('Failed to update payment escrow for prescription:', escrowError);
        // Continue with appointment update even if escrow fails
      }
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update prescription verification: ${error.message}`);
  }
};

export const updateAppointmentPrescriptionVerification = async (
  appointmentId: string,
  verificationData: {
    prescriptionVerified?: boolean;
    prescriptionDelivered?: boolean;
    prescriptionVerificationTime?: Date;
  }
) => {
  try {
    // Get appointment details for logging
    const appointmentDoc = await getDoc(doc(db, 'appointments', appointmentId));
    if (!appointmentDoc.exists()) {
      throw new Error('Appointment not found');
    }
    
    const appointment = appointmentDoc.data();
    const patientId = appointment.patientId;

    const updates: any = {
      ...verificationData,
      updatedAt: serverTimestamp(),
    };

    if (verificationData.prescriptionVerified) {
      // Create audit log for prescription verification
      await createPrescriptionVerificationLog(
        appointmentId,
        patientId,
        'prescription_verified',
        {
          verificationTime: verificationData.prescriptionVerificationTime || new Date(),
          previousStatus: {
            prescriptionDelivered: appointment.prescriptionDelivered || false,
            prescriptionVerified: appointment.prescriptionVerified || false
          }
        }
      );

      // Release patient payment via escrow system
      try {
        await updatePaymentEscrowStatus(appointmentId, 'prescription_verified');
      } catch (escrowError) {
        console.error('Failed to update payment escrow for prescription:', escrowError);
        // Continue with appointment update even if escrow fails
      }
    }

    if (verificationData.prescriptionDelivered && !appointment.prescriptionDelivered) {
      // Create audit log for prescription delivery
      await createPrescriptionVerificationLog(
        appointmentId,
        patientId,
        'prescription_delivered',
        {
          deliveryTime: new Date(),
          previousStatus: {
            prescriptionDelivered: appointment.prescriptionDelivered || false
          }
        }
      );
    }

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to update appointment prescription verification: ${error.message}`);
  }
};

export const initializeMeetingVerification = async (appointmentId: string) => {
  try {
    const updates = {
      verification: {
        doctorVerified: false,
        patientVerified: false
      },
      prescriptionDelivered: false,
      prescriptionVerified: false,
      updatedAt: serverTimestamp(),
    };

    await updateDoc(doc(db, 'appointments', appointmentId), updates);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to initialize meeting verification: ${error.message}`);
  }
};

// ============ DATABASE MIGRATION ============
export const migrateExistingAppointments = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'appointments'));
    const batch = [];
    
    for (const docSnapshot of querySnapshot.docs) {
      const appointment = docSnapshot.data();
      
      // Only update appointments that don't have verification fields
      if (!appointment.verification) {
        const updates = {
          verification: {
            doctorVerified: false,
            patientVerified: false
          },
          prescriptionDelivered: false,
          prescriptionVerified: false,
          updatedAt: serverTimestamp(),
        };
        
        batch.push(updateDoc(doc(db, 'appointments', docSnapshot.id), updates));
      }
    }
    
    await Promise.all(batch);
    return { success: true, migratedCount: batch.length };
  } catch (error: any) {
    throw new Error(`Failed to migrate appointments: ${error.message}`);
  }
};

// ============ PAYMENT ESCROW INTEGRATION ============
export const initializePaymentEscrow = async (paymentId: string, appointmentId: string) => {
  try {
    const escrowStatus: PaymentEscrowStatus = {
      status: 'held',
      releaseConditions: {
        meetingVerified: false,
        prescriptionDelivered: false,
        prescriptionVerified: false
      }
    };

    await updateDoc(doc(db, 'payments', paymentId), {
      escrowStatus,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to initialize payment escrow: ${error.message}`);
  }
};

export const updatePaymentEscrowStatus = async (
  appointmentId: string,
  releaseType: 'meeting_verified' | 'prescription_verified'
) => {
  try {
    // Get the payment for this appointment
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('appointmentId', '==', appointmentId)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    if (paymentsSnapshot.empty) {
      throw new Error('No payment found for this appointment');
    }

    const paymentDoc = paymentsSnapshot.docs[0];
    const payment = paymentDoc.data();
    const currentEscrow = payment.escrowStatus || {
      status: 'held',
      releaseConditions: {
        meetingVerified: false,
        prescriptionDelivered: false,
        prescriptionVerified: false
      }
    };

    // Update release conditions
    const updatedConditions = { ...currentEscrow.releaseConditions };
    
    if (releaseType === 'meeting_verified') {
      updatedConditions.meetingVerified = true;
    } else if (releaseType === 'prescription_verified') {
      updatedConditions.prescriptionVerified = true;
      updatedConditions.prescriptionDelivered = true;
    }

    // Determine if payment should be released
    let newStatus = currentEscrow.status;
    if (releaseType === 'meeting_verified' && updatedConditions.meetingVerified) {
      newStatus = 'released_to_doctor';
    } else if (releaseType === 'prescription_verified' && updatedConditions.prescriptionVerified) {
      newStatus = 'released_to_patient';
    }

    const updatedEscrow: PaymentEscrowStatus = {
      ...currentEscrow,
      status: newStatus,
      releaseConditions: updatedConditions,
      releaseTimestamp: newStatus !== 'held' ? serverTimestamp() : currentEscrow.releaseTimestamp
    };

    await updateDoc(doc(db, 'payments', paymentDoc.id), {
      escrowStatus: updatedEscrow,
      status: newStatus === 'released_to_doctor' || newStatus === 'released_to_patient' ? 'completed' : payment.status,
      updatedAt: serverTimestamp(),
    });

    return { success: true, escrowStatus: updatedEscrow };
  } catch (error: any) {
    throw new Error(`Failed to update payment escrow: ${error.message}`);
  }
};

export const getPaymentEscrowStatus = async (appointmentId: string) => {
  try {
    const paymentsQuery = query(
      collection(db, 'payments'),
      where('appointmentId', '==', appointmentId)
    );
    const paymentsSnapshot = await getDocs(paymentsQuery);
    
    if (paymentsSnapshot.empty) {
      return null;
    }

    const payment = paymentsSnapshot.docs[0].data();
    return payment.escrowStatus || null;
  } catch (error: any) {
    throw new Error(`Failed to get payment escrow status: ${error.message}`);
  }
};

export const releaseEscrowPayment = async (
  appointmentId: string,
  releaseReason: 'meeting_completed' | 'prescription_delivered' | 'dispute_resolved'
) => {
  try {
    const result = await updatePaymentEscrowStatus(
      appointmentId,
      releaseReason === 'meeting_completed' ? 'meeting_verified' : 'prescription_verified'
    );

    // Log the payment release
    await addDoc(collection(db, 'payment_logs'), {
      appointmentId,
      action: 'escrow_release',
      reason: releaseReason,
      timestamp: serverTimestamp(),
      escrowStatus: result.escrowStatus
    });

    return result;
  } catch (error: any) {
    throw new Error(`Failed to release escrow payment: ${error.message}`);
  }
};

// ============ PRESCRIPTION VERIFICATION AUDIT TRAIL ============
export const createPrescriptionVerificationLog = async (
  appointmentId: string,
  patientId: string,
  action: 'prescription_delivered' | 'prescription_verified',
  details?: any
) => {
  try {
    await addDoc(collection(db, 'prescription_verification_logs'), {
      appointmentId,
      patientId,
      action,
      details: details || {},
      timestamp: serverTimestamp(),
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to create prescription verification log: ${error.message}`);
  }
};

export const getPrescriptionVerificationLogs = async (appointmentId: string) => {
  try {
    const q = query(
      collection(db, 'prescription_verification_logs'),
      where('appointmentId', '==', appointmentId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch prescription verification logs: ${error.message}`);
  }
};

export const getPaymentAuditTrail = async (appointmentId: string) => {
  try {
    const q = query(
      collection(db, 'payment_logs'),
      where('appointmentId', '==', appointmentId),
      orderBy('timestamp', 'desc')
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as any[];
  } catch (error: any) {
    throw new Error(`Failed to fetch payment audit trail: ${error.message}`);
  }
};

