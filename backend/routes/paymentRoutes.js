const express = require("express");
const PaymentTracking = require("../models/PaymentTracking");
const Loan = require("../models/Loan");
const router = express.Router();

// Get all payments
router.get("/", async (req, res, next) => {
  try {
    const payments = await PaymentTracking.find();
    return res.status(200).json({ success: true, data: payments });
  } catch (error) {
    next(error);
  }
});

// Get payment by ID
router.get("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const payment = await PaymentTracking.findById(id);
    if (!payment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }
    return res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
});

// Create a new payment
router.post("/", async (req, res, next) => {
  try {
    const { loanID, amount } = req.body;
    const loan = await Loan.findOne({ loanID });

    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }

    if (!loan.adminFeePaid) {
      loan.outstandingBalance += loan.adminFee;
      loan.adminFeePaid = true;
    }

    if (amount > loan.outstandingBalance) {
      return res.status(400).json({ success: false, message: "Payment exceeds outstanding balance." });
    }

    loan.outstandingBalance -= amount;
    await loan.save();

    const newPayment = new PaymentTracking({
      ...req.body,
      outstandingBalance: loan.outstandingBalance,
    });
    await newPayment.save();

    return res.status(201).json({ success: true, message: "Payment recorded successfully.", data: newPayment });
  } catch (error) {
    next(error);
  }
});

// Update a payment
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingPayment = await PaymentTracking.findById(id);
    if (!existingPayment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    const loan = await Loan.findOne({ loanID: existingPayment.loanID });
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }

    const amountDifference = req.body.amount - existingPayment.amount;
    if (loan.outstandingBalance - amountDifference < 0) {
      return res.status(400).json({ success: false, message: "Updated payment exceeds outstanding balance." });
    }

    loan.outstandingBalance -= amountDifference;
    await loan.save();

    Object.assign(existingPayment, req.body);
    await existingPayment.save();

    return res.status(200).json({ success: true, message: "Payment updated successfully.", data: existingPayment });
  } catch (error) {
    next(error);
  }
});

// Delete a payment
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedPayment = await PaymentTracking.findByIdAndDelete(id);
    if (!deletedPayment) {
      return res.status(404).json({ success: false, message: "Payment not found." });
    }

    const loan = await Loan.findOne({ loanID: deletedPayment.loanID });
    if (loan) {
      loan.outstandingBalance += deletedPayment.amount;
      await loan.save();
    }

    return res.status(200).json({ success: true, message: "Payment deleted successfully.", data: deletedPayment });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
