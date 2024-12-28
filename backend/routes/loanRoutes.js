const express = require("express");
const Loan = require("../models/Loan");
const router = express.Router();

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

// Create a new loan
router.post("/", async (req, res, next) => {
  try {
    const { loanAmount, adminFee } = req.body;
    req.body.outstandingBalance = loanAmount + (adminFee || 0);
    const newLoan = new Loan(req.body);
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
    Object.assign(existingLoan, req.body);
    await existingLoan.save();
    return res.status(200).json({ success: true, message: "Loan updated successfully.", data: existingLoan });
  } catch (error) {
    next(error);
  }
});

// Delete a loan
router.delete("/:id", async (req, res, next) => {
  try {
    const { id } = req.params;
    const deletedLoan = await Loan.findByIdAndDelete(id);
    if (!deletedLoan) {
      return res.status(404).json({ success: false, message: "Loan not found." });
    }
    return res.status(200).json({ success: true, message: "Loan deleted successfully.", data: deletedLoan });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
