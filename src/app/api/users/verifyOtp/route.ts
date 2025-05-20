import { NextRequest, NextResponse } from "next/server";
import { twilioClient, verifyServiceSID } from "@/lib/twillo";

export async function POST(request: NextRequest) {
  try {
    const { to, code } = await request.json();

    if (!to || !code) {
      return NextResponse.json(
        { success: false, message: "Phone number and verification code are required" },
        { status: 400 }
      );
    }

    const verification = await twilioClient.verify.v2
      .services(verifyServiceSID)
      .verificationChecks.create({ to, code });

    return NextResponse.json({
      success: verification.status === "approved",
      status: verification.status
    });
  } catch (error) {
    console.error("Verify Check Error:", error);
    return NextResponse.json(
      { success: false, message: error },
      { status: 500 }
    );
  }
}