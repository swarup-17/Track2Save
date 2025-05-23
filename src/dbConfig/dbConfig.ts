import mongoose from "mongoose";

let isConnected = false;

export async function connect() {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI!);

    mongoose.connection.once("connected", () => {
      console.log("Connected to database");
    });

    mongoose.connection.once("error", (err) => {
      console.error("Error connecting to database:", err);
      process.exit(1);
    });

    isConnected = true;
  } catch (error) {
    console.error("Initial database connection error:", error);
  }
}
