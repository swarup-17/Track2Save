import mongoose, { Schema } from "mongoose";

const expenseSchema = new mongoose.Schema(
  {
    tag: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
    },
    isSplitted: {
      type: Boolean,
      default: false,
    },
    payers: {
      type: [
        {
          userId: {
            type: Schema.Types.ObjectId,
            ref: "User",
          },
          amount: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    note: {
      type: String,
    },
  },
  { timestamps: true }
);

const Expense =
  mongoose.models.Expense || mongoose.model("Expense", expenseSchema);

export default Expense;
