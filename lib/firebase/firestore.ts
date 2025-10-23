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