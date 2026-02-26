import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { phone, otp } = await request.json();
    
    // Verify OTP from database
    const isValid = await verifyOTP(phone, otp);
    
    if (isValid) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json(
        { error: 'Invalid OTP' },
        { status: 400 }
      );
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Verification failed' },
      { status: 500 }
    );
  }
}
