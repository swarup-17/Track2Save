import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSID } from "@/lib/twillo";

export async function POST(request: NextRequest) {
  try {
    const { to } = await request.json();

    if (!to) {
      return NextResponse.json(
        { success: false, message: "Phone number is required" },
        { status: 400 }
      );
    }

    // Validate phone number format
    const phoneRegex = /^\+91\d{10}$/;
    if (!phoneRegex.test(to)) {
      return NextResponse.json(
        { success: false, message: "Invalid phone number format. Use E.164 format: +1234567890" },
        { status: 400 }
      );
    }

    const verification = await twilioClient.verify.v2
      .services(verifyServiceSID)
      .verifications.create({ to, channel: "sms" });

    return NextResponse.json({
      success: true,
      status: verification.status
    });
  } catch (error) {
    console.error("Send Verification Error:", error);
    return NextResponse.json(
      { success: false, message: error },
      { status: 500 }
    );
  }
}