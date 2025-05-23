import { getDataFromToken } from "@/helpers/getDataFromTokens";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";

connect();

interface Friend {
  userId: mongoose.Types.ObjectId;
  amount: number;
}

interface Payer {
  userId: string;
  amount: number;
}

export const POST = async (request: NextRequest) => {
  try {
    const userId = await getDataFromToken(request);
    const user = await User.findById(userId).select("-password -phone");

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const reqBody = await request.json();
    const { category, amount, note, payers, isSplitted, date } = reqBody;

    // Validation
    if (!category) {
      return NextResponse.json(
        { error: "Category is required" },
        { status: 400 }
      );
    }

    if (!amount || amount <= 0) {
      return NextResponse.json(
        { error: "Valid amount is required" },
        { status: 400 }
      );
    }

    // Create new expense object
    const newExpense = {
      category: category,
      amount: parseFloat(amount),
      note: note || "",
      date: date ? new Date(date) : new Date(),
      isSplitted: isSplitted || false,
      payers: payers || [{ userId: userId, amount: parseFloat(amount) }]
    };

    user.expenses.push(newExpense);

    if (isSplitted && payers && payers.length > 1) {
      for (let i = 0; i < payers.length; i++) {
        const payer = payers[i] as Payer;
        const payerId = payer.userId;
        const payerAmount = parseFloat(payer.amount.toString());

        if (payerId === userId) {
          continue;
        }

        try {
          const friend = await User.findById(payerId);
          if (!friend) {
            console.warn(`Friend with ID ${payerId} not found`);
            continue;
          }

          const currentUserInFriendsList = friend.friends?.find(
            (f: Friend) => f.userId.toString() === userId.toString()
          );

          if (currentUserInFriendsList) {
            currentUserInFriendsList.amount -= payerAmount;
          }

          const friendInUsersList = user.friends?.find(
            (f: Friend) => f.userId.toString() === payerId.toString()
          );

          if (friendInUsersList) {
            friendInUsersList.amount += payerAmount;
          }

          await friend.save();
        } catch (friendError) {
          console.error(`Error updating friend ${payerId}:`, friendError);
        }
      }
    }

    await user.save();

    const addedExpense = user.expenses[user.expenses.length - 1];
    const formattedExpense = {
      ...addedExpense.toObject(),
      _id: addedExpense._id,
      category: addedExpense.category,
      amount: addedExpense.amount,
      note: addedExpense.note || '',
      date: addedExpense.date,
      isSplitted: addedExpense.isSplitted,
      payers: addedExpense.payers
    };

    return NextResponse.json(
      {
        message: "Expense added successfully",
        success: true,
        data: formattedExpense,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error("Error adding expense:", error);
    
    if (error instanceof mongoose.Error.ValidationError) {
      return NextResponse.json(
        { error: "Validation error: " + error.message },
        { status: 400 }
      );
    }
    
    if (error instanceof mongoose.Error.CastError) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};