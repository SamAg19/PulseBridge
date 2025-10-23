import { NextRequest, NextResponse } from 'next/server';
import { createTask, getTasksByDoctor } from '@/lib/firebase/firestore';

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const taskData = {
      ...data,
      currency: 'PYUSD' as const,
      status: 'draft' as const,
    };
    const result = await createTask(taskData);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorId = searchParams.get('doctorId');
    
    if (!doctorId) {
      return NextResponse.json({ error: 'Doctor ID required' }, { status: 400 });
    }
    
    const tasks = await getTasksByDoctor(doctorId);
    return NextResponse.json({ tasks });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
