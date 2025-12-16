import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import Profile from "../models/Profile.models.js";

const router = express.Router();

/* ---------------- GET profile ---------------- */
router.get("/", protect, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate("user", "name email avatar"); // ✅ INCLUDE AVATAR

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json({
      name: profile.user.name,
      email: profile.user.email,
      avatar: profile.user.avatar, // ✅ CORRECT
      dietPreference: profile.dietPreference,
      budget: profile.budget,
      medicalConditions: profile.medicalConditions,
    });
  } catch (err) {
    console.error("Profile fetch error", err);
    res.status(500).json({ message: "Server error" });
  }
});

/* ---------------- CREATE / UPDATE profile ---------------- */
router.post("/", protect, async (req, res) => {
  try {
    const data = req.body;

    const profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { ...data, user: req.user.id },
      { new: true, upsert: true }
    );

    res.json(profile);
  } catch (err) {
    console.error("Profile save error", err);
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
