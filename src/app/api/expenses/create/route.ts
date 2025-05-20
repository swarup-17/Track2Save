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

export const POST = async (request: NextRequest) => {
  try {
    const userId = await getDataFromToken(request);
    const user = await User.findById({ _id: userId }).select(
      "-password -phone"
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const reqBody = await request.json();
    const { tag, amount, note, payers, isSplitted } = reqBody;

    // Construct the expense object to be added to the user's expenses array
    const newExpense = {
      category: tag,
      amount,
      note: note || "",
      date: new Date(),
      isSplitted: isSplitted || false,
      payers: payers || [{ userId: userId, amount: amount }] // Ensure payers is always set
    };

    // Add the new expense to the user's expenses array
    user.expenses.push(newExpense);
    
    // If expense is split, update balances (this logic might need adjustment
    // if splitting is still required with the new model, but for now, focusing on direct expense add)
    if (payers && payers.length > 1) {
      for(let i = 1; i < payers.length; i++) {
        const friendId = payers[i].userId;
        const friendAmount = payers[i].amount;
        
        const friend = await User.findById(friendId);
        if (!friend) {
          continue;
        }
        
        // Update balances in both directions
        // Find current user in friend's friend list
        const currentUserInFriendsList = friend.friends?.find(
          (f: Friend) => f.userId.toString() === userId.toString()
        );
        
        if (currentUserInFriendsList) {
          currentUserInFriendsList.amount -= friendAmount; // Friend owes less to current user
        }
        
        // Find friend in current user's friend list
        const friendInUsersList = user.friends?.find(
          (f: Friend) => f.userId.toString() === friendId.toString()
        );
        
        if (friendInUsersList) {
          friendInUsersList.amount += friendAmount; // Friend owes more to current user
        }
        
        await friend.save();
      }
      
      // Save user again after all friend updates
      await user.save();
    }

    await user.save(); // Save the user document with the new expense
    
    // Get the newly added expense and format it for frontend consistency
    const addedExpense = user.expenses[user.expenses.length - 1];
    const formattedExpense = {
      ...addedExpense.toObject(),
      category: addedExpense.category || addedExpense.tag,
      tag: addedExpense.tag || addedExpense.category,
      note: addedExpense.note || ''
    };

    return NextResponse.json(
      {
        message: "Expense added to user successfully",
        success: true,
        data: formattedExpense, // Return the formatted expense
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error adding expense:", error);
    return NextResponse.json(
      { error: "Something went wrong"},
      { status: 500 }
    );
  }
};
