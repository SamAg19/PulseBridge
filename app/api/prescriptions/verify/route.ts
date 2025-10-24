import { NextRequest, NextResponse } from 'next/server';
import { 
  updateAppointmentPrescriptionVerification,
  getPaymentEscrowStatus,
  createPrescriptionVerificationLog
} from '@/lib/firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const { appointmentId, patientId, verified } = await req.json();

    if (!appointmentId || !patientId || typeof verified !== 'boolean') {
      return NextResponse.json(
        { error: 'Missing required fields: appointmentId, patientId, verified' },
        { status: 400 }
      );
    }

    // Update appointment with prescription verification
    const result = await updateAppointmentPrescriptionVerification(appointmentId, {
      prescriptionVerified: verified,
      prescriptionVerificationTime: verified ? new Date() : undefined
    });

    if (!result.success) {
      throw new Error('Failed to update prescription verification');
    }

    // Get updated payment escrow status
    const escrowStatus = await getPaymentEscrowStatus(appointmentId);

    return NextResponse.json({
      success: true,
      message: verified 
        ? 'Prescription verification confirmed successfully'
        : 'Prescription verification removed',
      escrowStatus,
      paymentReleased: escrowStatus?.status === 'released_to_patient'
    });

  } catch (error: any) {
    console.error('Error in prescription verification API:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process prescription verification' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const appointmentId = searchParams.get('appointmentId');

    if (!appointmentId) {
      return NextResponse.json(
        { error: 'Missing appointmentId parameter' },
        { status: 400 }
      );
    }

    // Get payment escrow status
    const escrowStatus = await getPaymentEscrowStatus(appointmentId);

    return NextResponse.json({
      success: true,
      escrowStatus
    });

  } catch (error: any) {
    console.error('Error fetching prescription verification status:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch verification status' },
      { status: 500 }
    );
  }
}