import { connect } from "@/dbConfig/dbConfig";
import { getDataFromToken } from "@/helpers/getDataFromTokens";
import User from "@/models/userModel";
import mongoose from "mongoose";
import { NextRequest, NextResponse } from "next/server";

connect();

interface Payer {
  userId: mongoose.Types.ObjectId | string;
  amount: number;
}

interface FriendMap {
  [userId: string]: {
    name: string;
    phone: string;
  };
}

export const GET = async (request: NextRequest) => {
  try {
    const userId = await getDataFromToken(request);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized - Invalid token" }, { status: 401 });
    }

    const url = new URL(request.url);
    const month = url.searchParams.get("month");
    const year = url.searchParams.get("year");
    const tag = url.searchParams.get("tag");
    const limit = parseInt(url.searchParams.get("limit") || "50");
    const page = parseInt(url.searchParams.get("page") || "1");

    const userObjectId = new mongoose.Types.ObjectId(userId as string);

    const user = await User.findById(userObjectId)
      .select("expenses friends name")
      .populate("friends.userId", "name phone");

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friendMap: FriendMap = {};
    user.friends.forEach((friend: { userId: { _id: mongoose.Types.ObjectId; name: string; phone: string } }) => {
      friendMap[friend.userId._id.toString()] = {
        name: friend.userId.name,
        phone: friend.userId.phone
      };
    });

    const userExpenses = [...user.expenses];
    const expenseIds = new Set(userExpenses.map(e => e._id.toString()));

    const friendsWithExpenses = await User.find(
      { "expenses.payers.userId": userObjectId },
      { "expenses": { $elemMatch: { "payers.userId": userObjectId } } }
    ).select("name");

    // Add friend's expenses where user is a payer
    for (const friend of friendsWithExpenses) {
      for (const expense of friend.expenses || []) {
        const id = expense._id.toString();
        if (!expenseIds.has(id)) {
          expenseIds.add(id);
          userExpenses.push({
            ...expense.toObject(),
            creator: { id: friend._id, name: friend.name }
          });
        }
      }
    }

    // Filter by date
    const filteredByDate = userExpenses.filter(exp => {
      if (!exp.date) return false;
      const expenseDate = new Date(exp.date);
      if (month && year) {
        const start = new Date(Number(year), Number(month) - 1, 1);
        const end = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
        return expenseDate >= start && expenseDate <= end;
      }
      if (year) {
        const start = new Date(Number(year), 0, 1);
        const end = new Date(Number(year), 11, 31, 23, 59, 59, 999);
        return expenseDate >= start && expenseDate <= end;
      }
      return true;
    });

    // Filter by category
    const filteredExpenses = tag && tag !== "All"
      ? filteredByDate.filter(exp => exp.category === tag || exp.tag === tag)
      : filteredByDate;

    filteredExpenses.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      
      if (!month && year) {
        return dateA.getTime() - dateB.getTime();
      }
      
      if (month && year) {
        return dateB.getTime() - dateA.getTime();
      }
      return dateB.getTime() - dateA.getTime();
    });

    // Pagination
    const total = filteredExpenses.length;
    const start = (page - 1) * limit;
    const paginated = filteredExpenses.slice(start, start + limit);

    const enhancedExpenses = paginated.map(exp => {
      const expense = JSON.parse(JSON.stringify(exp));

      expense.category = expense.category || expense.tag || "Misc";
      expense.tag = expense.tag || expense.category;
      expense.note = expense.note || expense.description || "";
      expense.description = expense.description || expense.note;

      if (expense.payers) {
        expense.payers = expense.payers.map((payer: Payer) => {
          const uid = payer.userId.toString();
          const isCurrentUser = uid === userObjectId.toString();

          return {
            ...payer,
            name: isCurrentUser ? "You" : friendMap[uid]?.name || "Unknown",
            phone: isCurrentUser ? null : friendMap[uid]?.phone || null,
            isCurrentUser
          };
        });
      }

      return expense;
    });

    return NextResponse.json({
      message: "User expenses fetched successfully",
      success: true,
      data: enhancedExpenses,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });

  } catch (error) {
    console.error("Error fetching user expenses:", error);
    return NextResponse.json(
      { error: "Failed to fetch user expenses" },
      { status: 500 }
    );
  }
};