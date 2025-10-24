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
  serverTimestamp
} from 'firebase/firestore';
import { db } from './config';
import { Task, Appointment, Payment } from '../types';

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
    const docRef = await addDoc(collection(db, 'payments'), {
      ...paymentData,
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
    await updateDoc(doc(db, 'appointments', appointmentId), {
      meetingLink,
      meetingId: meetingId || `meeting-${Date.now()}`,
      status: 'confirmed',
      updatedAt: serverTimestamp(),
    });
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