// 🚨 LOAD ENV FIRST — NOTHING ABOVE THIS
import "./config/env.js";

import app from "./app.js";
import connectDB from "./config/db.js";

console.log("ENV CHECK:", {
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  MONGO_URI: process.env.MONGO_URI,
});

const startServer = async () => {
  try {
    await connectDB();

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (err) {
    console.error("Server failed:", err);
    process.exit(1);
  }
};

startServer();
