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
  adminFee: { type: Number, default: 0 },
  description: { type: String },
});

module.exports = mongoose.model("PaymentTracking", paymentTrackingSchema);
