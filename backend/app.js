import express from "express";
import cors from "cors";
import passport from "passport";

// Import passport config
import "./config/passport.js";

// Import routes
import authRoutes from "./routes/auth.routes.js";
import profileRoutes from "./routes/profile.routes.js";
import homeRoutes from "./routes/home.routes.js";
import dailyRoutes from "./routes/daily.routes.js";
import recommendRoutes from "./routes/recommend.routes.js"; // ✅ ADD

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize passport
app.use(passport.initialize());

// Test route
app.get("/", (req, res) => {
  res.send("Dietcare app is running");
});

// Routes
app.use("/auth", authRoutes);
app.use("/api/profile", profileRoutes);
app.use("/api/home", homeRoutes);
app.use("/api/daily", dailyRoutes);
app.use("/api/recommend", recommendRoutes); // ✅ IMPORTANT

export default app;
