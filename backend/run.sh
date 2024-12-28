#!/bin/bash

# Define project structure
PROJECT_DIR="backend"
MODELS_DIR="$PROJECT_DIR/models"
ROUTES_DIR="$PROJECT_DIR/routes"
MIDDLEWARE_DIR="$PROJECT_DIR/middleware"

# Create project directories
mkdir -p $MODELS_DIR
mkdir -p $ROUTES_DIR
mkdir -p $MIDDLEWARE_DIR

# Navigate to the project directory

# Initialize Node.js project
echo "Initializing Node.js project..."

# Create .env file
echo "Creating .env file..."
cat > .env <<EOL
PORT=5000
MONGO_URI=mongodb://localhost:27017/loanManagement
EOL

# Create server.js
echo "Creating server.js..."
cat > server.js <<EOL
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bodyParser = require("body-parser");
const morgan = require("morgan");
const errorHandler = require("./middleware/errorHandler");

const clientRoutes = require("./routes/clientRoutes");
const loanRoutes = require("./routes/loanRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(morgan("dev"));

// Routes
app.use("/api/clients", clientRoutes);
app.use("/api/loans", loanRoutes);
app.use("/api/payments", paymentRoutes);

// Error Handling
app.use(errorHandler);

// MongoDB Connection
mongoose
  .connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("MongoDB connected"))
  .catch((err) => {
    console.error("MongoDB connection error:", err.message);
    process.exit(1);
  });

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});
EOL

# Create middleware/errorHandler.js
echo "Creating middleware/errorHandler.js..."
cat > $MIDDLEWARE_DIR/errorHandler.js <<EOL
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
};

module.exports = errorHandler;
EOL

# Create models/Client.js
echo "Creating models/Client.js..."
cat > $MODELS_DIR/Client.js <<EOL
const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  clientID: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  address: { type: String },
  email: { type: String },
  contactNumber: { type: String },
  saID: { type: String },
  passport: { type: String },
});

module.exports = mongoose.model("Client", clientSchema);
EOL

# Create models/Loan.js
echo "Creating models/Loan.js..."
cat > $MODELS_DIR/Loan.js <<EOL
const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  loanID: { type: String, required: true, unique: true },
  clientID: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  repaymentTerms: { type: String },
  adminFee: { type: Number },
});

module.exports = mongoose.model("Loan", loanSchema);
EOL

# Create models/PaymentTracking.js
echo "Creating models/PaymentTracking.js..."
cat > $MODELS_DIR/PaymentTracking.js <<EOL
const mongoose = require("mongoose");

const paymentTrackingSchema = new mongoose.Schema({
  paymentID: { type: String, required: true, unique: true },
  loanID: { type: String, required: true },
  clientID: { type: String, required: true },
  scheduledDate: { type: Date },
  paymentDate: { type: Date },
  amount: { type: Number, required: true },
  outstandingBalance: { type: Number, required: true },
  interestEarned: { type: Number },
  description: { type: String },
});

module.exports = mongoose.model("PaymentTracking", paymentTrackingSchema);
EOL

# Create routes/clientRoutes.js
echo "Creating routes/clientRoutes.js..."
cat > $ROUTES_DIR/clientRoutes.js <<EOL
const express = require("express");
const Client = require("../models/Client");
const router = express.Router();

// Get all clients
router.get("/", async (req, res, next) => {
  try {
    const clients = await Client.find();
    res.status(200).json(clients);
  } catch (error) {
    next(error);
  }
});

// Add a new client
router.post("/", async (req, res, next) => {
  try {
    const client = new Client(req.body);
    await client.save();
    res.status(201).json(client);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
EOL

# Create routes/loanRoutes.js
echo "Creating routes/loanRoutes.js..."
cat > $ROUTES_DIR/loanRoutes.js <<EOL
const express = require("express");
const Loan = require("../models/Loan");
const router = express.Router();

// Get all loans
router.get("/", async (req, res, next) => {
  try {
    const loans = await Loan.find();
    res.status(200).json(loans);
  } catch (error) {
    next(error);
  }
});

// Add a new loan
router.post("/", async (req, res, next) => {
  try {
    const loan = new Loan(req.body);
    await loan.save();
    res.status(201).json(loan);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
EOL

# Create routes/paymentRoutes.js
echo "Creating routes/paymentRoutes.js..."
cat > $ROUTES_DIR/paymentRoutes.js <<EOL
const express = require("express");
const PaymentTracking = require("../models/PaymentTracking");
const router = express.Router();

// Get all payments
router.get("/", async (req, res, next) => {
  try {
    const payments = await PaymentTracking.find();
    res.status(200).json(payments);
  } catch (error) {
    next(error);
  }
});

// Add a new payment
router.post("/", async (req, res, next) => {
  try {
    const payment = new PaymentTracking(req.body);
    await payment.save();
    res.status(201).json(payment);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
EOL

echo "Backend setup complete. Navigate to the backend folder and start the server using: npm start"
