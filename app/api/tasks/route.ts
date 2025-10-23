import { NextRequest, NextResponse } from 'next/server';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const taskData = {
      ...data,
      currency: 'PYUSD',
      status: 'draft',
      createdAt: serverTimestamp(),
    };
    const docRef = await addDoc(collection(db, 'tasks'), taskData);
    return NextResponse.json({ success: true, taskId: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
