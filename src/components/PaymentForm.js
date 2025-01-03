// src/components/PaymentForm.js

import React, { useState, useEffect } from "react";
import CurrencyCodes from "currency-codes"; // **Importing the Currency Codes Library**

const generatePaymentID = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PMT-${randomDigits}`;
};

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
    currency: "USD", // **Added Currency Field with Default Value**
  });
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [loanCurrency, setLoanCurrency] = useState("USD"); // **State to Store Loan's Currency**
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [allTermDetails, setAllTermDetails] = useState([]); // Store all terms
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [interestForTerm, setInterestForTerm] = useState(0);
  const [adminFeeForTerm, setAdminFeeForTerm] = useState(0); // **Admin Fee for Term**
  const [totalExpectedForTerm, setTotalExpectedForTerm] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [isCalculationDetailsOpen, setIsCalculationDetailsOpen] = useState(false); // State for collapsible section

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const response = await fetch(`http://13.246.7.5:5000/api/clients`);
        if (!response.ok) throw new Error("Failed to fetch clients.");
        const { data } = await response.json();
        setClients(data);
      } catch (error) {
        setNotification?.({ type: "error", message: "Could not load clients." });
      }
    };

    fetchClients();

    if (!existingPayment) {
      const newPaymentID = generatePaymentID();
      setFormData((prev) => ({ ...prev, paymentID: newPaymentID }));
    } else {
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
        currency: existingPayment.currency || "USD", // **Populate Currency Field if Exists**
      });
      setLoanCurrency(existingPayment.currency || "USD"); // **Set Loan Currency for Existing Payment**
    }
  }, [existingPayment, setNotification]);

  useEffect(() => {
    const fetchLoans = async () => {
      if (!formData.clientID) return;

      try {
        const response = await fetch(`http://13.246.7.5:5000/api/loans`);
        if (!response.ok) throw new Error("Failed to fetch loans.");
        const { data } = await response.json();
        const filteredLoans = data.filter((loan) => loan.clientID === formData.clientID);
        setLoans(filteredLoans);
      } catch (error) {
        setNotification?.({ type: "error", message: "Could not load loans for the selected client." });
      }
    };

    fetchLoans();
  }, [formData.clientID, setNotification]);

  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!formData.loanID) {
        setLoanDetails(null);
        setFormData((prev) => ({
          ...prev,
          outstandingBalance: "",
          interestEarned: "",
          currency: "USD", // **Reset Currency to Default if No Loan Selected**
        }));
        setLoanCurrency("USD"); // **Reset Loan Currency**
        setAllTermDetails([]); // **Reset Term Details**
        setPaymentTerms([]);
        setExpectedAmount(0);
        setInterestForTerm(0);
        setAdminFeeForTerm(0);
        setTotalExpectedForTerm(0);
        return;
      }

      try {
        const response = await fetch(`http://13.246.7.5:5000/api/loans/loans_by_LID/${formData.loanID}`);
        if (!response.ok) throw new Error("Failed to fetch loan details.");
        const { data } = await response.json();
        setLoanDetails(data);
        setLoanCurrency(data.currency || "USD"); // **Set Loan Currency from Loan Details**

        const terms = Array.from({ length: data.termMonths }, (_, i) => ({
          label: `Term ${i + 1}`,
          value: i + 1,
        }));
        setPaymentTerms(terms);

        calculateAllTermDetails(data);
      } catch (error) {
        setNotification?.({ type: "error", message: "Could not load loan details." });
      }
    };

    fetchLoanDetails();
  }, [formData.loanID, setNotification]);

  /**
   * Calculate all term details with corrected logic:
   * - Admin Fee is applied only in the first term
   */
  const calculateAllTermDetails = (loan) => {
    if (!loan) {
      console.error("Loan object is undefined");
      return;
    }
  
    const { loanAmount, termMonths = 12, interestRate, adminFee, startDate } = loan;
  
    // Validate termMonths to avoid division by zero
    if (termMonths <= 0) {
      console.error("Term months must be greater than 0");
      return;
    }
  
    // Convert interest rate to monthly interest rate
    const monthlyInterestRate = interestRate / 12;
  
    // Calculate fixed monthly payment using the amortisation formula
    const fixedMonthlyPayment =
      (loanAmount * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -termMonths));
    const roundedFixedMonthlyPayment = parseFloat(fixedMonthlyPayment.toFixed(2));
  
    // Calculate total admin fee (one-time fee applied only to the first term)
    const totalAdminFee = parseFloat((loanAmount * adminFee).toFixed(2));
  
    let balance = loanAmount;
    const terms = [];
  
    // Validate and initialise startDate
    const initialStartDate = startDate ? new Date(startDate) : new Date();
    if (isNaN(initialStartDate.getTime())) {
      console.error("Invalid startDate provided in loan object");
      return;
    }
  
    // Adjust Term 1 schedule date
    const firstPaymentDate = new Date(initialStartDate);
    firstPaymentDate.setDate(30); // Set to 30th of the month
  
    if (firstPaymentDate <= initialStartDate) {
      // If setting to the 30th doesn't push it to the next month, add 1 month
      firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
    }
  
    let scheduledDate = new Date(firstPaymentDate);
  
    for (let term = 1; term <= termMonths; term++) {
      const interestPayment = parseFloat((balance * monthlyInterestRate).toFixed(2));
      const principalPayment = parseFloat((roundedFixedMonthlyPayment - interestPayment).toFixed(2));
  
      // Adjust the last payment to account for rounding errors
      const finalPrincipalPayment =
        term === termMonths ? parseFloat(balance.toFixed(2)) : principalPayment;
      const finalTotalPayment =
        term === termMonths
          ? parseFloat((finalPrincipalPayment + interestPayment).toFixed(2))
          : roundedFixedMonthlyPayment;
  
      const endingBalance =
        term === termMonths ? 0 : parseFloat((balance - finalPrincipalPayment).toFixed(2));
  
      // Apply admin fee only for the first term
      const adminFeeForTerm = term === 1 ? totalAdminFee : 0;
      const totalPayment = parseFloat((finalTotalPayment + adminFeeForTerm).toFixed(2));
  
      terms.push({
        term,
        paymentDate: scheduledDate.toISOString(), // Format as ISO string
        paymentAmount: totalPayment,
        principal: term === termMonths ? finalPrincipalPayment : principalPayment,
        interest: interestPayment,
        adminFee: adminFeeForTerm,
        remainingBalance: endingBalance,
        beginningBalance: balance,
      });
  
      balance = endingBalance;
  
      // Increment the scheduled date by one month for the next term
      scheduledDate.setMonth(scheduledDate.getMonth() + 1);
  
      // Ensure scheduled date aligns with the 30th of the month
      scheduledDate.setDate(30);
    }
  
    setAllTermDetails(terms); // Update state with calculated terms
  };
  
  
  

  const handleChange = (e) => {
    const { name, value } = e.target;
  
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: "" })); // Clear error on field change
  
    if (name === "paymentTerm" && loanDetails) {
      const termDetails = allTermDetails.find((t) => t.term === parseInt(value, 10));
  
      if (termDetails) {
        setFormData((prev) => ({
          ...prev,
          scheduledDate: termDetails.paymentDate
            ? termDetails.paymentDate.split("T")[0] // Extract only the date part
            : "", // Fallback to empty string if paymentDate is not valid
        }));
        setExpectedAmount(termDetails.paymentAmount || 0);
        setInterestForTerm(termDetails.interest || 0);
        setAdminFeeForTerm(termDetails.adminFee || 0);
        setTotalExpectedForTerm(termDetails.paymentAmount || 0);
      } else {
        setFormData((prev) => ({ ...prev, scheduledDate: "" })); // Reset scheduledDate
        setExpectedAmount(0);
        setInterestForTerm(0);
        setAdminFeeForTerm(0);
        setTotalExpectedForTerm(0);
      }
    }
  };
  
  

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
        currency: loanCurrency, // **Include Currency in Submission Data**
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
            Use this form to record and manage loan payments. Select the client and their respective loan, choose the payment term, and enter the payment details. Ensure all information is accurate before submitting.
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
                <strong>Principal Amount:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {expectedAmount.toFixed(2)-interestForTerm.toFixed(2)-adminFeeForTerm.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Interest for Term:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {interestForTerm.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Admin Fee for Term:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {adminFeeForTerm.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Total Expected for Term:</strong>{" "}
                {CurrencyCodes.code(loanCurrency)?.symbol || "$"}
                {expectedAmount.toFixed(2)}
              </p>
              <p className="text-gray-600">
                <strong>Currency:</strong> {loanCurrency}
              </p>
            </div>

            {/* Collapsible Calculation Details */}
            {isCalculationDetailsOpen && (
              <div className="mt-4 p-4 bg-white border border-gray-300 rounded-md shadow-inner">
                <h4 className="text-md font-semibold text-gray-700 mb-2">Calculation Details</h4>
                <ul className="list-disc list-inside text-gray-600 space-y-1">
                  <li>
                    <strong>Principal per Term:</strong> The total loan amount is divided equally across all terms.
                  </li>
                  <li>
                    <strong>Interest per Term:</strong> Calculated based on the outstanding balance and the monthly interest rate.
                  </li>
                  <li>
                    <strong>Admin Fee:</strong> A one-time administrative fee applied only in the first term.
                  </li>
                  <li>
                    <strong>Total Expected:</strong> The sum of expected amount and admin fee for the term.
                  </li>
                  <li>
                    <strong>Scheduled Date:</strong> The date when the payment is due, starting 30 days after the loan start date and recurring monthly.
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
