import express from "express";
import { protect } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/summary", protect, async (req, res) => {
  try {
    // Later this will come from DB
    res.json({
      caloriesTarget: 2000,
      caloriesConsumed: 1450,
      mealsPlanned: [
        { type: "Breakfast", name: "Veggie Omelette", completed: true },
        { type: "Lunch", name: "Quinoa Bowl", completed: true },
        { type: "Dinner", name: "Lentil Curry", completed: false }
      ],
      weeklyProgress: [
        { day: "Mon", followed: true },
        { day: "Tue", followed: true },
        { day: "Wed", followed: false },
        { day: "Thu", followed: true },
        { day: "Fri", followed: true },
        { day: "Sat", followed: true },
        { day: "Sun", followed: false }
      ],
      healthInsights: [
        {
          title: "Low sodium meals recommended",
          description: "Based on hypertension",
          type: "heart"
        }
      ]
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load home data" });
  }
});

export default router;
