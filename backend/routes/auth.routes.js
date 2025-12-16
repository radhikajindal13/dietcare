import express from "express";
import passport from "passport";
import { generateToken } from "../utils/generateToken.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const token = generateToken(req.user);

    // redirect with token
    res.redirect(
      `http://localhost:5173/dashboard?token=${token}`
    );
  }
);

export default router;
