import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    name: String,
    email: {
      type: String,
      unique: true,
    },
    avatar: String,
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
