import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { DoctorProfile } from '../types';

export const registerDoctor = async (email: string, password: string, doctorData: Omit<DoctorProfile, 'verificationStatus' | 'createdAt' | 'updatedAt'>) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const doctorDoc: DoctorProfile = {
      ...doctorData,
      verificationStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await setDoc(doc(db, 'doctors', userCredential.user.uid), doctorDoc);
    return { success: true, userId: userCredential.user.uid };
  } catch (error: any) {
    throw new Error(`Registration failed: ${error.message}`);
  }
};

export const loginDoctor = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    throw new Error(`Login failed: ${error.message}`);
  }
};

export const logoutDoctor = async () => {
  await signOut(auth);
};
