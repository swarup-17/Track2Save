import { connect } from "@/dbConfig/dbConfig";
import User from "@/models/userModel";
import { NextRequest } from "next/server";

connect();

export const DELETE = async (req: NextRequest) => {
  try {
    await connect();

    const { userId, expenseId } = await req.json();

    const user = await User.findById(userId);
    if (!user) return new Response("User not found", { status: 404 });

    const index = user.expenses.findIndex(
      (e: { _id: { toString: () => string } }) => e._id.toString() === expenseId
    );
    if (index === -1) return new Response("Expense not found", { status: 404 });

    user.expenses.splice(index, 1);
    user.markModified("expenses");
    await user.save();

    return new Response("Expense deleted", { status: 200 });
  } catch (err) {
    console.error("Delete Error:", err);
    return new Response("Server error", { status: 500 });
  }
};
