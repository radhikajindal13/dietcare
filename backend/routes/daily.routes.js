import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import DailyLog from "../models/DailyLog.models.js";

const router = express.Router();

/**
 * GET today's log
 */
router.get("/today", protect, async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  let log = await DailyLog.findOne({
    userId: req.user.id,
    date: today
  });

  // Create if not exists
  if (!log) {
    log = await DailyLog.create({
      userId: req.user.id,
      date: today,
      caloriesTarget: 2000,
      caloriesConsumed: 0,
      meals: [
        { type: "Breakfast", name: "Not planned", completed: false },
        { type: "Lunch", name: "Not planned", completed: false },
        { type: "Dinner", name: "Not planned", completed: false }
      ]
    });
  }

  res.json(log);
});

/**
 * PATCH meal completion
 */
router.patch("/meal", protect, async (req, res) => {
  const { type, completed } = req.body;
  const today = new Date().toISOString().slice(0, 10);

  const log = await DailyLog.findOne({
    userId: req.user.id,
    date: today
  });

  if (!log) {
    return res.status(404).json({ message: "Daily log not found" });
  }

  const meal = log.meals.find(m => m.type === type);
  if (meal) {
    meal.completed = completed;
  }

  await log.save();
  res.json(log);
});

export default router;
