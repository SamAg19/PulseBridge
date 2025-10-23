import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './config';
import { DoctorProfile } from '../types';

export const registerDoctorWithWallet = async (
  walletAddress: string, 
  doctorData: Omit<DoctorProfile, 'verificationStatus' | 'createdAt' | 'updatedAt' | 'walletAddress'>
) => {
  try {
    const doctorDoc: DoctorProfile & { walletAddress: string } = {
      walletAddress,
      ...doctorData,
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'doctors', walletAddress), doctorDoc);
    return { success: true, doctorId: walletAddress };
  } catch (error: any) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

export const checkDoctorRegistration = async (walletAddress: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'doctors', walletAddress));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    return null;
  } catch (error: any) {
    throw new Error(`Failed to check registration: ${error.message}`);
  }
};

export const getDoctorByWallet = async (walletAddress: string) => {
  try {
    const docSnap = await getDoc(doc(db, 'doctors', walletAddress));
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() };
    }
    throw new Error('Doctor not found');
  } catch (error: any) {
    throw new Error(`Failed to fetch doctor: ${error.message}`);
  }
};
