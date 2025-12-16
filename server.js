
require("dotenv").config();
const express = require("express");
const crypto = require("crypto");
const { exec } = require("child_process");
const { connectDB } = require("./config/db");
const contactRoutes = require("./routes/contactRoutes");
const quoteRoutes = require("./routes/quoteRoutes");
const blogRoutes = require("./routes/blogRoutes");
const authRoutes = require("./routes/authRoutes");
const pageRoutes = require("./routes/pageRoutes");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const { connectRedis } = require("./config/redis");

// ✅ Express app
const app = express();

// ✅ Middleware: CORS
app.use(cors());

// ✅ Middleware: Capture raw body for GitHub webhook signature verification
app.use(
  express.json({
    limit: "50mb",
    verify: (req, res, buf) => {
      req.rawBody = buf; // important for HMAC
    },
  })
);

// Also handle URL-encoded requests (with rawBody)
app.use(
  express.urlencoded({
    limit: "50mb",
    extended: true,
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
  })
);


// ✅ Connect to Redis
connectRedis();

// ✅ Connect to DB
connectDB();

// ✅ Ensure uploads directory exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// ✅ Routes
app.use("/api/B2Badmin", contactRoutes);
app.use("/api/B2Badmin", quoteRoutes);
app.use("/api/B2Badmin", blogRoutes);
app.use("/api/B2Badmin", pageRoutes);
app.use("/api/auth", authRoutes); // GitHub deploy routes here

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
