import { getDataFromToken } from "@/helpers/getDataFromTokens";
import { NextRequest, NextResponse } from "next/server";
import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import mongoose from "mongoose";
import { Expense } from "@/types/expense";

connect();

interface Friend {
  userId: mongoose.Types.ObjectId;
  amount: number;
}

export const PUT = async (request: NextRequest) => {
  try {
    const userId = await getDataFromToken(request);
    const user = await User.findById({ _id: userId });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const url = new URL(request.url);
    const expenseId = url.searchParams.get('id');

    if (!expenseId) {
      return NextResponse.json({ error: "Expense ID is required" }, { status: 400 });
    }

    const reqBody = await request.json();
    const { amount, category, note, payers, isSplitted, date } = reqBody;

    const expenseIndex = user.expenses.findIndex(
      (e: Expense) => e._id.toString() === expenseId.toString()
    );

    if (expenseIndex === -1) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    const oldExpense = user.expenses[expenseIndex];

    if (oldExpense.isSplitted && oldExpense.payers && oldExpense.payers.length > 1) {
      for (let i = 0; i < oldExpense.payers.length; i++) {
        const payer = oldExpense.payers[i];
        const payerId = payer.userId.toString();
        
        if (payerId === userId.toString()) continue;

        const oldAmount = payer.amount;
        const friend = await User.findById(payerId);
        if (!friend) continue;

        const friendRecord = friend.friends?.find(
          (f: Friend) => f.userId.toString() === userId.toString()
        );
        if (friendRecord) {
          friendRecord.amount += oldAmount; // Remove the debt
        }

        const userRecord = user.friends?.find(
          (f: Friend) => f.userId.toString() === payerId
        );
        if (userRecord) {
          userRecord.amount -= oldAmount; 
        }

        await friend.save();
      }
    }

    user.expenses[expenseIndex] = {
      ...oldExpense.toObject(),
      category: category,
      amount: amount,
      note: note || "",
      date: date ? new Date(date) : oldExpense.date,
      isSplitted: isSplitted || false,
      payers: payers || [{ userId: userId, amount: amount }],
      updatedAt: new Date()
    };

    if (isSplitted && payers && payers.length > 1) {
      for (let i = 0; i < payers.length; i++) {
        const payer = payers[i];
        const payerId = payer.userId;
        
        if (payerId === userId) continue;

        const payerAmount = payer.amount;
        const friend = await User.findById(payerId);
        if (!friend) continue;

        const friendRecord = friend.friends?.find(
          (f: Friend) => f.userId.toString() === userId.toString()
        );
        if (friendRecord) {
          friendRecord.amount -= payerAmount;
        }

        const userRecord = user.friends?.find(
          (f: Friend) => f.userId.toString() === payerId
        );
        if (userRecord) {
          userRecord.amount += payerAmount;
        }

        await friend.save();
      }
    }

    await user.save();

    const updatedExpense = user.expenses[expenseIndex];

    const formattedExpense = {
      ...updatedExpense.toObject(),
      category: updatedExpense.category,
      note: updatedExpense.note || "",
    };

    return NextResponse.json(
      {
        message: "Expense updated successfully",
        success: true,
        data: formattedExpense,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error updating expense:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
};