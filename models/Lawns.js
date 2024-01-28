import mongoose from "mongoose";

const lawnsSchema = new mongoose.Schema({
  lawnName: String,
});

export const Lawns = mongoose.model("Lawns", lawnsSchema);
