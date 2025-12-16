import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: String,
    age: Number,
    dietPreference: [String],
    allergies: [String],
    medicalConditions: [String],
    budget: String,
    tastePreferences: [String],
  },
  { timestamps: true }
);

export default mongoose.model("Profile", profileSchema);
