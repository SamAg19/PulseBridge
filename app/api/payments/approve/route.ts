import { NextRequest, NextResponse } from 'next/server';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, approverUserId } = await req.json();
    await updateDoc(doc(db, 'payments', paymentId), {
      status: 'approved',
      approvedBy: approverUserId,
      approvedAt: serverTimestamp(),
    });
    return NextResponse.json({ success: true, message: 'Payment approved successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
