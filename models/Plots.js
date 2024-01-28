import mongoose, { Schema } from "mongoose";

const plotsSchema = new mongoose.Schema({
  plotName: {
    type: String,
    unique: false,
  },
  structureId: {
    type: Schema.Types.ObjectId,
    ref: "Structure",
  },
  status: String,
});

export const Plots = mongoose.model("Plots", plotsSchema);
