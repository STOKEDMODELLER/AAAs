require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const path = require("path");

// Import your routes
const clientRoutes = require("./routes/clientRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("combined")); // Detailed logging for development and production

// Set Security Headers
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  next();
});

// API Routes
app.use("/api/clients", clientRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);

// Serve React Frontend in Production
if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../frontend/build");
  app.use(express.static(buildPath));

  app.get("*", (req, res) => {
    if (!req.path.startsWith("/api")) {
      res.sendFile(path.join(buildPath, "index.html"));
    }
  });
}

// MongoDB Connection
async function connectDB() {
  const retries = 5; // Retry attempts for DB connection
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 30000,
      });
      console.log("MongoDB connected successfully");
      return;
    } catch (err) {
      console.error(`MongoDB connection error (attempt ${i + 1}):`, err.message);
      if (i === retries - 1) {
        console.error("Could not connect to MongoDB after multiple attempts. Exiting...");
        process.exit(1);
      }
      await new Promise(res => setTimeout(res, 5000)); // Wait 5 seconds before retrying
    }
  }
}
connectDB();

// Error Handling Middleware
app.use(errorHandler);

// Graceful Shutdown
process.on("SIGINT", async () => {
  console.log("Shutting down gracefully...");
  await mongoose.connection.close();
  console.log("MongoDB connection closed.");
  process.exit(0);
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
