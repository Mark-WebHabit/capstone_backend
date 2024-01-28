import mongoose, { Schema } from "mongoose";

const deceasedSchema = new mongoose.Schema({
  plotId: {
    type: Schema.Types.ObjectId,
    ref: "Plots",
  },
  name: {
    type: String,
    default: null,
  },
  middleName: {
    type: String,
    default: null,
  },
  lastName: {
    type: String,
    default: null,
  },

  age: {
    type: Number,
    default: null,
  },
  birthDate: {
    type: String,
    default: null,
  },
  deathDate: {
    type: String,
    default: null,
  },
  phone: {
    type: String,
    default: null,
  },
  suffix: {
    type: String
  }
  
});

export const Deceaseds = mongoose.model("Deceaseds", deceasedSchema);
