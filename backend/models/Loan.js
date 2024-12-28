const mongoose = require("mongoose");

const loanSchema = new mongoose.Schema({
  loanID: { type: String, required: true, unique: true },
  clientID: { type: String, required: true },
  loanAmount: { type: Number, required: true },
  interestRate: { type: Number, required: true }, // Annual interest rate (e.g., 0.1 for 10%)
  termMonths: { type: Number, required: true, default: 12 },
  adminFee: { type: Number, default: 0 }, // One-time admin fee
  adminFeePaid: { type: Boolean, default: false },
  outstandingBalance: { type: Number, required: true, default: 0 },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
});

module.exports = mongoose.model("Loan", loanSchema);
