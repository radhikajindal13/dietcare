import express from "express";
import { protect } from "../middleware/auth.middleware.js";
import { getRecommendedMeals } from "../controllers/recommend.controller.js";

const router = express.Router();

router.get("/", protect, getRecommendedMeals);

export default router;
