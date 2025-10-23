import { NextRequest, NextResponse } from 'next/server';
import { updatePaymentStatus } from '@/lib/firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { paymentId, approverUserId } = await req.json();
    const result = await updatePaymentStatus(paymentId, 'approved', approverUserId);
    return NextResponse.json({ 
      success: true, 
      message: 'Payment approved successfully' 
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
