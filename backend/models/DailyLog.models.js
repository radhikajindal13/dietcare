import mongoose from "mongoose";

const mealSchema = new mongoose.Schema(
  {
    type: { type: String, required: true }, // Breakfast, Lunch, Dinner
    name: { type: String, required: true },
    completed: { type: Boolean, default: false }
  },
  { _id: false }
);

const dailyLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true
    },
    caloriesTarget: {
      type: Number,
      default: 2000
    },
    caloriesConsumed: {
      type: Number,
      default: 0
    },
    meals: [mealSchema]
  },
  { timestamps: true }
);

dailyLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export default mongoose.model("DailyLog", dailyLogSchema);
