// src/components/PaymentForm.js

import React, { useState, useEffect } from "react";
import CurrencyCodes from "currency-codes"; // Importing the Currency Codes Library

const generatePaymentID = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PMT-${randomDigits}`;
};

/**
 * PaymentForm - A form component to record and manage loan payments.
 * This version uses simple interest logic and sets the first scheduled date (Term 1)
 * to 30 days after the loan's start date, rather than matching the loan start date itself.
 */
const PaymentForm = ({ existingPayment, onSubmit, onClose, setNotification }) => {
  const [formData, setFormData] = useState({
    paymentID: "",
    loanID: "",
    clientID: "",
    paymentTerm: "",
    scheduledDate: "",
    paymentDate: "",
    amount: "",
    outstandingBalance: "",
    interestEarned: "",
    description: "",
    currency: "USD", // Default Currency
  });
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [loanCurrency, setLoanCurrency] = useState("USD");
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCalculationDetailsOpen, setIsCalculationDetailsOpen] = useState(false);

  // Simple interest breakdown for each term
  const [simpleMonthlyPayment, setSimpleMonthlyPayment] = useState(0);
  const [simpleMonthlyPrincipal, setSimpleMonthlyPrincipal] = useState(0);
  const [simpleMonthlyInterest, setSimpleMonthlyInterest] = useState(0);
  const [adminFeeForTerm, setAdminFeeForTerm] = useState(0);
  const [totalExpectedForTerm, setTotalExpectedForTerm] = useState(0);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch("http://13.246.7.5:5000/api/clients");
        if (!response.ok) throw new Error("Failed to fetch clients.");
        const { data } = await response.json();
        setClients(data);
      } catch (error) {
        setNotification?.({
          type: "error",
          message: "Could not load clients.",
        });
      }
    };

    fetchClients();

    if (!existingPayment) {
      const newPaymentID = generatePaymentID();
      setFormData((prev) => ({ ...prev, paymentID: newPaymentID }));
    } else {
      // Populate form data if editing an existing payment
      setFormData({
        paymentID: existingPayment.paymentID || "",
        clientID: existingPayment.clientID || "",
        loanID: existingPayment.loanID || "",
        paymentTerm: existingPayment.paymentTerm || "",
        scheduledDate: existingPayment.scheduledDate?.split("T")[0] || "",
        paymentDate: existingPayment.paymentDate?.split("T")[0] || "",
        amount: existingPayment.amount ? existingPayment.amount.toFixed(2) : "",
        outstandingBalance: existingPayment.outstandingBalance
          ? existingPayment.outstandingBalance.toFixed(2)
          : "",
        interestEarned: existingPayment.interestEarned
          ? existingPayment.interestEarned.toFixed(2)
          : "",
        description: existingPayment.description || "",
        currency: existingPayment.currency || "USD",
      });
      setLoanCurrency(existingPayment.currency || "USD");
    }
  }, [existingPayment, setNotification]);

  /**
   * Fetch loans for the selected client.
   */
  useEffect(() => {
    const fetchLoans = async () => {
      if (!formData.clientID) return;

      try {
        const response = await fetch("http://13.246.7.5:5000/api/loans");
        if (!response.ok) throw new Error("Failed to fetch loans.");
        const { data } = await response.json();
        const filteredLoans = data.filter((loan) => loan.clientID === formData.clientID);
        setLoans(filteredLoans);
      } catch (error) {
        setNotification?.({
          type: "error",
          message: "Could not load loans for the selected client.",
        });
      }
    };

    fetchLoans();
  }, [formData.clientID, setNotification]);

  /**
   * Fetch loan details for the selected loanID.
   * Prepare term options and compute simple interest schedule.
   */
  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!formData.loanID) {
        setLoanDetails(null);
        setFormData((prev) => ({
          ...prev,
          outstandingBalance: "",
          interestEarned: "",
          currency: "USD",
        }));
        setLoanCurrency("USD");
        setPaymentTerms([]);
        return;
      }

      try {
        const response = await fetch(
          `http://13.246.7.5:5000/api/loans/loans_by_LID/${formData.loanID}`
        );
        if (!response.ok) throw new Error("Failed to fetch loan details.");
        const { data } = await response.json();
        setLoanDetails(data);
        setLoanCurrency(data.currency || "USD");

        // Prepare term dropdown
        const terms = Array.from({ length: data.termMonths }, (_, i) => ({
          label: `Term ${i + 1}`,
          value: i + 1,
        }));
        setPaymentTerms(terms);

        // Calculate simple interest details
        calculateSimpleInterestSchedule(data);
      } catch (error) {
        setNotification?.({
          type: "error",
          message: "Could not load loan details.",
        });
      }
    };

    fetchLoanDetails();
  }, [formData.loanID, setNotification]);

  /**
   * Using simple interest for the entire loan:
   * totalInterest = P × r × (termMonths / 12)
   * monthlyPayment = (P + totalInterest) / termMonths
   * monthlyPrincipal = P / termMonths
   * monthlyInterest = totalInterest / termMonths
   *
   * We store these base amounts for display; the PaymentForm can decide
   * how to handle admin fees or schedule details for each term.
   */
  const calculateSimpleInterestSchedule = (loan) => {
    if (!loan) return;

    const { loanAmount, interestRate, termMonths = 12, adminFee } = loan;
    if (termMonths <= 0) return;

    const totalSimpleInterest = loanAmount * interestRate * (termMonths / 12);
    const monthlyPayment = (loanAmount + totalSimpleInterest) / termMonths;
    const monthlyPrincipal = loanAmount / termMonths;
    const monthlyInterest = totalSimpleInterest / termMonths;

    setSimpleMonthlyPayment(monthlyPayment);
    setSimpleMonthlyPrincipal(monthlyPrincipal);
    setSimpleMonthlyInterest(monthlyInterest);

    // Admin fee is a one-time fee, typically applied in the first term
    const adminFeeAmount = loanAmount * adminFee;
    setAdminFeeForTerm(adminFeeAmount);
  };

  /**
   * Whenever the user changes form fields, handle special cases:
   * - paymentTerm: compute scheduled date and expected amounts
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // clear error on field change

    if (name === "paymentTerm") {
      const termNumber = parseInt(value, 10);

      if (loanDetails && termNumber > 0 && termNumber <= loanDetails.termMonths) {
        // 1) Compute a new scheduledDate based on the loan's start date plus (termNumber × 30) days
        if (loanDetails.startDate) {
          const startDate = new Date(loanDetails.startDate);
          // Add (termNumber × 30) days
          const scheduledDate = new Date(startDate.getTime());
          scheduledDate.setDate(scheduledDate.getDate() + 30 * termNumber);

          setFormData((prev) => ({
            ...prev,
            scheduledDate: scheduledDate.toISOString().split("T")[0],
          }));
        }

        // 2) If it is the first term, we add the admin fee onto the monthly payment
        const isFirstTerm = termNumber === 1;
        const currentTermPayment = simpleMonthlyPayment + (isFirstTerm ? adminFeeForTerm : 0);
        setTotalExpectedForTerm(currentTermPayment);
      } else {
        // Reset if invalid term
        setFormData((prev) => ({ ...prev, scheduledDate: "" }));
        setTotalExpectedForTerm(0);
      }
    }
  };

  /**
   * Validate required fields before submitting.
   */
  const validateFields = () => {
    const newErrors = {};
    if (!formData.clientID) newErrors.clientID = "Client is required.";
    if (!formData.loanID) newErrors.loanID = "Loan is required.";
    if (!formData.paymentTerm) newErrors.paymentTerm = "Payment term is required.";
    if (!formData.paymentDate) newErrors.paymentDate = "Payment date is required.";
    if (!formData.amount) newErrors.amount = "Payment amount is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Submit payment data to the parent or server.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateFields()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const submissionData = {
        ...formData,
        amount: parseFloat(formData.amount),
        outstandingBalance: parseFloat(formData.outstandingBalance || 0),
        interestEarned: parseFloat(formData.interestEarned || 0),
        currency: loanCurrency,
      };

      await onSubmit(submissionData);
      setNotification?.({ type: "success", message: "Payment successfully submitted." });
      onClose();
    } catch (error) {
      setNotification?.({ type: "error", message: "Failed to submit payment." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="w-full max-w-3xl p-6 bg-white rounded-lg shadow-lg overflow-y-auto max-h-full">
        {/* Modal Header */}
        <div className="mb-4">
          <h2 className="text-2xl font-semibold text-gray-800">Manage Loan Payment</h2>
          <p className="text-gray-600 mt-2">
            This form uses simple interest and sets Term 1's scheduled date to 30 days after
            the loan's start date, rather than on the start date itself.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Selection */}
            <div>
              <label htmlFor="clientID" className="block text-gray-700 font-medium mb-1">
                Client:
              </label>
              <select
                id="clientID"
                name="clientID"
                value={formData.clientID}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  errors.clientID ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">-- Select a Client --</option>
                {clients.map((client) => (
                  <option key={client._id} value={client._id}>
                    {client.name}
                  </option>
                ))}
              </select>
              {errors.clientID && <p className="text-red-500 text-sm">{errors.clientID}</p>}
            </div>

            {/* Loan Selection */}
            <div>
              <label htmlFor="loanID" className="block text-gray-700 font-medium mb-1">
                Loan:
              </label>
              <select
                id="loanID"
                name="loanID"
                value={formData.loanID}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  errors.loanID ? "border-red-500" : "border-gray-300"
                }`}
                disabled={!formData.clientID}
              >
                <option value="">-- Select a Loan --</option>
                {loans.map((loan) => (
                  <option key={loan.loanID} value={loan.loanID}>
                    {loan.loanID} - {CurrencyCodes.code(loan.currency)?.symbol || "$"}
                    {parseFloat(loan.loanAmount).toFixed(2)}
                  </option>
                ))}
              </select>
              {errors.loanID && <p className="text-red-500 text-sm">{errors.loanID}</p>}
            </div>

            {/* Scheduled Date */}
            <div>
              <label htmlFor="scheduledDate" className="block text-gray-700 font-medium mb-1">
                Scheduled Date:
              </label>
              <input
                type="date"
                id="scheduledDate"
                name="scheduledDate"
                value={formData.scheduledDate}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
              />
            </div>

            {/* Payment Term */}
            <div>
              <label htmlFor="paymentTerm" className="block text-gray-700 font-medium mb-1">
                Payment Term:
              </label>
              <select
                id="paymentTerm"
                name="paymentTerm"
                value={formData.paymentTerm}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  errors.paymentTerm ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">-- Select a Term --</option>
                {paymentTerms.map((term) => (
                  <option key={term.value} value={term.value}>
                    {term.label}
                  </option>
                ))}
              </select>
              {errors.paymentTerm && <p className="text-red-500 text-sm">{errors.paymentTerm}</p>}
            </div>

            {/* Payment Date */}
            <div>
              <label htmlFor="paymentDate" className="block text-gray-700 font-medium mb-1">
                Payment Date:
              </label>
              <input
                type="date"
                id="paymentDate"
                name="paymentDate"
                value={formData.paymentDate}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  errors.paymentDate ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.paymentDate && <p className="text-red-500 text-sm">{errors.paymentDate}</p>}
            </div>
          </div>

          {/* Term Summary */}
          <div className="p-4 bg-gray-50 border border-gray-300 rounded-md">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">Term Summary</h3>
              {/* Button to toggle calculation details */}
              <button
                type="button"
                onClick={() => setIsCalculationDetailsOpen(!isCalculationDetailsOpen)}
                className="text-blue-600 hover:text-blue-800 focus:outline-none"
              >
                {isCalculationDetailsOpen ? "Hide Details ▲" : "Show Details ▼"}
              </button>
            </div>
            <div className="mt-2 space-y-2">
              <p className="text-gray-600">
                <strong>Principal per Term:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {simpleMonthlyPrincipal.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Interest per Term (Simple Interest):</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {simpleMonthlyInterest.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Admin Fee (if applied in 1st Term):</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {adminFeeForTerm.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Expected for this Term:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {totalExpectedForTerm.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Currency:</strong> {loanCurrency}
              </p>
            </div>

            {/* Collapsible Calculation Details */}
            {isCalculationDetailsOpen && (
              <div className="mt-4 p-4 bg-white border border-gray-300 rounded-md shadow-inner">
                <h4 className="text-md font-semibold text-gray-700 mb-2">
                  Calculation Details
                </h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    <strong>Simple Interest:</strong> Total = Principal × Annual Rate × (Months/12).
                  </li>
                  <li>
                    <strong>Monthly Payment:</strong> (Principal + Total Interest) / termMonths.
                  </li>
                  <li>
                    <strong>Scheduled Date (Term 1):</strong> 30 days after the loan's start date.
                  </li>
                  <li>
                    <strong>Admin Fee:</strong> A one-time fee often added to the first term.
                  </li>
                </ul>
              </div>
            )}
          </div>

          {/* Payment Amount */}
          <div>
            <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">
              Payment Amount:
            </label>
            <div className="flex items-center">
              <span className="mr-2">
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
              </span>
              <input
                type="number"
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-md ${
                  errors.amount ? "border-red-500" : "border-gray-300"
                }`}
                min="0"
                step="0.01"
                placeholder="Enter the payment amount"
              />
            </div>
            {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-gray-700 font-medium mb-1">
              Description:
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              rows="3"
              placeholder="Optional: Add any notes or descriptions related to this payment."
            ></textarea>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200 ${
                isSubmitting ? "opacity-50 cursor-not-allowed" : ""
              }`}
            >
              {isSubmitting ? "Submitting..." : "Submit Payment"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentForm;
