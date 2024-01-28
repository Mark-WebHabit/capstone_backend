import mongoose from "mongoose";

const loginHistory = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "users",
      required: true,
    },
    loginDate: {
      type: String,
      required: true,
    },
    loginTime: {
      type: String,
      required: true,
    },
    ipAddress: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

export const LoginHistory = mongoose.model("LoginHistory", loginHistory);
