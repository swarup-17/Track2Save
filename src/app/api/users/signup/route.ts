import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";

connect();

export async function POST(request: NextRequest) {
    try {
        const reqBody = await request.json();
        const { name, phone, password } = reqBody;

         // Validate required fields
        if (!name || !phone || !password) {
            return NextResponse.json(
                { success: false, message: "All fields are required" },
                { status: 400 }
            );
        }

        // Validate phone format
        const phoneRegex = /^\+91\d{10}$/;
        if (!phoneRegex.test(phone)) {
            return NextResponse.json(
                { success: false, message: "Invalid phone number format" },
                { status: 400 }
            );
        }

        // Check if user exists
        const existingUser = await User.findOne({ phone });
        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "Phone number already registered" },
                { status: 400 }
            );
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // create user
        const newUser = new User({
            name,
            phone,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        return NextResponse.json(
            {
                message: "User created successfully",
                success: true,
                savedUser
            }, { status: 201 }
        )
    } catch (error) {
        console.error("Signup Error:", error);
        return NextResponse.json(
            { success: false, message: "Internal server error" },
            { status: 500 }
        );
    }
}
