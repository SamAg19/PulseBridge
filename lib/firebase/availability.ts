import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  where,
  serverTimestamp,
  updateDoc,
  deleteDoc,
} from 'firebase/firestore';
import { db } from './config';
import { DoctorAvailability, TimeSlot } from '../types';

/**
 * Create or update doctor availability
 * This is the ONLY doctor data stored in Firebase - just their available time slots
 */
export const setDoctorAvailability = async (
  doctorId: number,
  walletAddress: string,
  timeSlots: TimeSlot[]
) => {
  try {
    const docRef = doc(db, 'doctor_availability', walletAddress);

    await setDoc(docRef, {
      doctorId,
      walletAddress,
      timeSlots,
      updatedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
    }, { merge: true });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to set availability: ${error.message}`);
  }
};

/**
 * Get doctor availability by wallet address
 */
export const getDoctorAvailability = async (
  walletAddress: string
): Promise<DoctorAvailability | null> => {
  try {
    const docRef = doc(db, 'doctor_availability', walletAddress);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
    } as DoctorAvailability;
  } catch (error: any) {
    throw new Error(`Failed to get availability: ${error.message}`);
  }
};

/**
 * Get doctor availability by on-chain doctor ID
 */
export const getDoctorAvailabilityById = async (
  doctorId: number
): Promise<DoctorAvailability | null> => {
  try {
    const q = query(
      collection(db, 'doctor_availability'),
      where('doctorId', '==', doctorId)
    );

    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return null;
    }

    const doc = querySnapshot.docs[0];
    return {
      id: doc.id,
      ...doc.data(),
    } as DoctorAvailability;
  } catch (error: any) {
    throw new Error(`Failed to get availability by ID: ${error.message}`);
  }
};

/**
 * Add a time slot to doctor's availability
 */
export const addTimeSlot = async (
  walletAddress: string,
  newSlot: TimeSlot
) => {
  try {
    const availability = await getDoctorAvailability(walletAddress);

    if (!availability) {
      throw new Error('Doctor availability not found. Create availability first.');
    }

    const updatedSlots = [...availability.timeSlots, newSlot];

    const docRef = doc(db, 'doctor_availability', walletAddress);
    await updateDoc(docRef, {
      timeSlots: updatedSlots,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to add time slot: ${error.message}`);
  }
};

/**
 * Remove a time slot from doctor's availability
 */
export const removeTimeSlot = async (
  walletAddress: string,
  slotToRemove: { date: string; startTime: string }
) => {
  try {
    const availability = await getDoctorAvailability(walletAddress);

    if (!availability) {
      throw new Error('Doctor availability not found');
    }

    const updatedSlots = availability.timeSlots.filter(
      slot => !(slot.date === slotToRemove.date && slot.startTime === slotToRemove.startTime)
    );

    const docRef = doc(db, 'doctor_availability', walletAddress);
    await updateDoc(docRef, {
      timeSlots: updatedSlots,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to remove time slot: ${error.message}`);
  }
};

/**
 * Mark a time slot as booked
 */
export const markSlotAsBooked = async (
  walletAddress: string,
  slotToBook: { date: string; startTime: string }
) => {
  try {
    const availability = await getDoctorAvailability(walletAddress);

    if (!availability) {
      throw new Error('Doctor availability not found');
    }

    const updatedSlots = availability.timeSlots.map(slot => {
      if (slot.date === slotToBook.date && slot.startTime === slotToBook.startTime) {
        return { ...slot, isBooked: true };
      }
      return slot;
    });

    const docRef = doc(db, 'doctor_availability', walletAddress);
    await updateDoc(docRef, {
      timeSlots: updatedSlots,
      updatedAt: serverTimestamp(),
    });

    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to mark slot as booked: ${error.message}`);
  }
};

/**
 * Get available (unbooked) slots for a doctor
 */
export const getAvailableSlots = async (
  walletAddress: string
): Promise<TimeSlot[]> => {
  try {
    const availability = await getDoctorAvailability(walletAddress);

    if (!availability) {
      return [];
    }

    // Filter out booked slots and past dates
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];

    return availability.timeSlots.filter(slot => {
      const isNotBooked = !slot.isBooked;
      const isNotPast = slot.date >= currentDate;
      return isNotBooked && isNotPast;
    });
  } catch (error: any) {
    throw new Error(`Failed to get available slots: ${error.message}`);
  }
};

/**
 * Clear all availability for a doctor
 */
export const clearDoctorAvailability = async (walletAddress: string) => {
  try {
    const docRef = doc(db, 'doctor_availability', walletAddress);
    await deleteDoc(docRef);
    return { success: true };
  } catch (error: any) {
    throw new Error(`Failed to clear availability: ${error.message}`);
  }
};

/**
 * Bulk get availability for multiple doctors
 */
export const getBulkDoctorAvailability = async (
  walletAddresses: string[]
): Promise<Record<string, DoctorAvailability>> => {
  try {
    const availabilityMap: Record<string, DoctorAvailability> = {};

    await Promise.all(
      walletAddresses.map(async (address) => {
        const availability = await getDoctorAvailability(address);
        if (availability) {
          availabilityMap[address] = availability;
        }
      })
    );

    return availabilityMap;
  } catch (error: any) {
    throw new Error(`Failed to get bulk availability: ${error.message}`);
  }
};
