// models/Loan.js
const mongoose = require("mongoose");
const CurrencyCodes = require("currency-codes"); // **Importing the Currency Codes Library**

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
  currency: { 
    type: String, 
    required: true, 
    enum: CurrencyCodes.codes(), // **Validate Against Currency Codes**
    default: "USD",
  }, // **Added Currency Field**
});

module.exports = mongoose.model("Loan", loanSchema);
