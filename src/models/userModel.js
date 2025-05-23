import mongoose, { Schema } from "mongoose";

const payerSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    default: 0,
  },
});

const expenseSchema = new Schema(
  {
    category: {
      type: String,
      required: [true, "Please add an expense category"],
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Please add an expense amount"],
      min: [0, "Amount cannot be negative"],
    },
    note: {
      type: String,
      trim: true,
      default: "",
    },
    date: {
      type: Date,
      required: [true, "Please add an expense date"],
      default: Date.now,
    },
    isSplitted: {
      type: Boolean,
      default: false,
    },
    payers: {
      type: [payerSchema],
      validate: {
        validator: function (payers) {
          return !this.isSplitted || (payers && payers.length > 0);
        },
        message: "Split expenses must have at least one payer",
      },
    },
  },
  { timestamps: true }
);

const friendSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  amount: {
    type: Number,
    default: 0,
  },
  since: {
    type: Date,
    default: Date.now,
  },
});

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name"],
      trim: true,
    },
    phone: {
      type: String,
      required: [true, "Please add a phone number"],
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Please add a password"],
      trim: true,
    },
    expenses: [expenseSchema],
    monthlyIncome: {
      type: Number,
      default: 0,
    },
    friends: {
      type: [friendSchema],
      default: [],
    },
    isPremium: {
      type: Boolean,
      default: false,
    },
    verifyToken: String,
    verifyTokenExpiry: Date,
  },
  { timestamps: true }
);

userSchema.pre("save", function (next) {
  if (!this.isModified("expenses")) return next();

  const friendIds = this.friends.map((friend) => friend.userId.toString());

  for (const expense of this.expenses) {
    if (!expense.isSplitted || !expense.payers || expense.payers.length === 0)
      continue;

    const nonFriendPayers = expense.payers.filter(
      (payer) =>
        !friendIds.includes(payer.userId.toString()) &&
        payer.userId.toString() !== this._id.toString()
    );

    if (nonFriendPayers.length > 0) {
      return next(new Error("Expense payers must be from your friends list"));
    }
  }

  next();
});

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;
