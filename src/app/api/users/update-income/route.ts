import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";

connect();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { userId, monthlyIncome } = reqBody;

        // Validate required fields
        if (!userId || monthlyIncome === undefined) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate monthly income is a number
        if (isNaN(Number(monthlyIncome)) || Number(monthlyIncome) < 0) {
            return NextResponse.json(
                { success: false, message: "Monthly income must be a valid number" },
                { status: 400 }
            );
        }

        // Update user's monthly income
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { monthlyIncome: Number(monthlyIncome) },
            { new: true }
        );

        if (!updatedUser) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                message: "Monthly income updated successfully",
                success: true,
                user: updatedUser
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("Update Income Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}