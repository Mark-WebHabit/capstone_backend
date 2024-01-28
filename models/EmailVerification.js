import mongoose, { Schema } from "mongoose";

const emailVerificationSchema = new mongoose.Schema({
  userId: {
    type: Schema.Types.ObjectId,
    required: true,
    ref: "users",
    unique: true,
  },
  token: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now(),
    expires: 1200, //20min
  },
});
export const Token = mongoose.model("token", emailVerificationSchema);
