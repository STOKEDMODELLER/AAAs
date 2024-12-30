const express = require("express");
const PaymentTracking = require("../models/PaymentTracking");
const Loan = require("../models/Loan");
const router = express.Router();

const CurrencyCodes = require("currency-codes"); // **Importing the Currency Codes Library**


// Create a new loan
router.post("/", async (req, res, next) => {
  try {
    const { loanAmount, adminFee, currency } = req.body;

    // Validate currency
    if (!CurrencyCodes.code(currency)) {
      return res.status(400).json({ success: false, message: "Invalid currency code." });
    }

    req.body.outstandingBalance = loanAmount + (adminFee || 0);
    const newLoan = new Loan({
      ...req.body,
      currency, // **Include Currency Field**
    });
    await newLoan.save();
    return res.status(201).json({ success: true, message: "Loan created successfully.", data: newLoan });
  } catch (error) {
    next(error);
  }
});

// Update a loan
router.put("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const existingLoan = await Loan.findById(id);
    if (!existingLoan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }

    // If currency is being updated, validate it
    if (req.body.currency && !CurrencyCodes.code(req.body.currency)) {
      return res.status(400).json({ success: false, message: "Invalid currency code." });
    }

    Object.assign(existingLoan, req.body);
    await existingLoan.save();
    return res.status(200).json({ success: true, message: "Loan updated successfully.", data: existingLoan });
  } catch (error) {
    next(error);
  }
});

// Get all loans
router.get("/", async (req, res, next) => {
  try {
    const loans = await Loan.find();
    return res.status(200).json({ success: true, data: loans });
  } catch (error) {
    next(error);
  }
});

// Get loan by loanID
router.get("/loans_by_LID/:loanID", async (req, res, next) => {
  try {
    const { loanID } = req.params;
    const loan = await Loan.findOne({ loanID });
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }
    return res.status(200).json({ success: true, data: loan });
  } catch (error) {
    next(error);
  }
});



router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;

    // Find the loan by ID
    const loan = await Loan.findById(id);
    if (!loan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }

    // Delete all payments associated with the loan
    await PaymentTracking.deleteMany({ loanID: loan.loanID });

    // Delete the loan
    await loan.deleteOne();

    return res.status(200).json({
      success: true,
      message: "Loan and all associated payments deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
