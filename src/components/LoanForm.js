// ./components/LoanForm.js
import React, { useState, useEffect } from "react";
import CurrencyCodes from "currency-codes"; // **Importing the Currency Codes Library**

/**
 * LoanForm - A form component to add or edit a loan.
 *
 * Props:
 * - existingLoan: (optional) The loan object if editing an existing loan.
 * - onSubmit: Function to handle form submission.
 * - onClose: Function to close the modal.
 * - setNotification: Function to set notifications.
 */
function LoanForm({ existingLoan, onSubmit, onClose, setNotification }) {
  const [formData, setFormData] = useState({
    loanID: "",
    clientID: "",
    loanAmount: "",
    interestRate: "",
    startDate: "",
    termMonths: "",
    endDate: "",
    adminFee: "",
    currency: "USD", // **Added Currency Field with Default Value**
  });
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Helper to format numbers with commas
   */
  const formatNumber = (value) => {
    if (!value) return "";
    const parts = value.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  /**
   * Helper to parse formatted numbers back to plain numbers
   */
  const parseNumber = (value) => value.replace(/,/g, "");

  /**
   * Generates a random Loan ID
   */
  const generateRandomLoanID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "LN";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  /**
   * Fetch clients from the server
   */
  const fetchClients = async () => {
    try {
      const response = await fetch("http://13.246.7.5:5000/api/clients");
      if (!response.ok) {
        throw new Error(`Failed to fetch clients: ${response.status}`);
      }
      const { data } = await response.json();
      setClients(data);
    } catch (err) {
      console.error("Error fetching clients:", err.message);
      setNotification?.({ type: "error", message: "Could not load clients." });
    }
  };

  /**
   * Calculate End Date based on Start Date and Term Months
   */
  const calculateEndDate = (start, term) => {
    if (!start || !term) return "";
    const startDate = new Date(start);
    if (isNaN(startDate)) return "";
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + parseInt(term, 10));
    // Adjust for month overflow
    if (endDate.getDate() !== startDate.getDate()) {
      endDate.setDate(0); // Set to last day of previous month
    }
    return endDate.toISOString().split("T")[0];
  };

  /**
   * Calculate interest earned
   */
  const calculateInterestEarned = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(loanAmount) || isNaN(interestRate)) return null;
    return (loanAmount * interestRate).toFixed(2);
  };

  /**
   * Calculate admin fee amount
   */
  const calculateAdminFeeAmount = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const adminFeePercentage = parseFloat(formData.adminFee);
    if (isNaN(loanAmount) || isNaN(adminFeePercentage)) return null;
    return (loanAmount * adminFeePercentage).toFixed(2);
  };

  /**
   * Calculate monthly required payment
   */
  const calculateMonthlyAmount = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const interestEarned = parseFloat(calculateInterestEarned());
    const adminFeeAmount = parseFloat(calculateAdminFeeAmount());
    const termMonthsNum = parseInt(formData.termMonths, 10);

    if (
      isNaN(loanAmount) ||
      isNaN(interestEarned) ||
      isNaN(adminFeeAmount) ||
      isNaN(termMonthsNum) ||
      termMonthsNum === 0
    )
      return null;

    const total = loanAmount + interestEarned + adminFeeAmount;
    return (total / termMonthsNum).toFixed(2);
  };

  /**
   * Initialize form data on component mount or when editing an existing loan
   */
  useEffect(() => {
    fetchClients();
    if (!existingLoan) {
      setFormData((prev) => ({ ...prev, loanID: generateRandomLoanID() }));
    }
  }, [existingLoan]);

  /**
   * Populate form data when editing an existing loan
   */
  useEffect(() => {
    if (existingLoan) {
      console.log("Existing Loan Currency:", existingLoan.currency); // Debugging Line
      setFormData({
        loanID: existingLoan.loanID || "",
        clientID: existingLoan.clientID || "",
        loanAmount: formatNumber(existingLoan.loanAmount),
        interestRate: existingLoan.interestRate || "",
        startDate: existingLoan.startDate?.split("T")[0] || "",
        termMonths: existingLoan.termMonths || "",
        endDate: existingLoan.endDate?.split("T")[0] || "",
        adminFee: formatNumber(existingLoan.adminFee),
        currency: existingLoan.currency || "USD", // **Populate Currency Field if Exists**
      });
    }
  }, [existingLoan]);

  /**
   * Handle input changes
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    // Handle number formatting for loanAmount and adminFee
    if (name === "loanAmount" || name === "adminFee") {
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData((prev) => ({ ...prev, [name]: formatNumber(numericValue) }));
    }
    // Handle changes to startDate or termMonths to recalculate endDate
    else if (name === "startDate" || name === "termMonths") {
      setFormData((prev) => ({ ...prev, [name]: value }));

      const newStartDate = name === "startDate" ? value : formData.startDate;
      const newTermMonths = name === "termMonths" ? value : formData.termMonths;
      const newEndDate = calculateEndDate(newStartDate, newTermMonths);

      setFormData((prev) => ({ ...prev, endDate: newEndDate }));
    }
    // Handle currency field
    else if (name === "currency") {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
    // Handle other fields
    else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { clientID, loanAmount, interestRate, startDate, termMonths, adminFee, currency } =
      formData;

    if (
      !clientID ||
      !loanAmount ||
      !interestRate ||
      !startDate ||
      !termMonths ||
      !adminFee ||
      !currency // **Ensure Currency is Selected**
    ) {
      setNotification?.({
        type: "error",
        message: "All fields must be filled out correctly.",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit({
        ...formData,
        termMonths: parseInt(formData.termMonths, 10),
        loanAmount: parseFloat(parseNumber(formData.loanAmount)),
        interestRate: parseFloat(formData.interestRate),
        adminFee: parseFloat(parseNumber(formData.adminFee)),
        currency, // **Include Currency in Submission Data**
      });
      onClose(); // Close modal only on successful submission
    } catch (err) {
      setNotification?.({ type: "error", message: err.message });
      // Do not call onClose(), keep the modal open to show the error
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Determine if loan summary can be calculated
   */
  const canCalculate = () => {
    const { loanAmount, interestRate, adminFee, startDate, termMonths, currency } = formData;
    return (
      loanAmount &&
      interestRate &&
      adminFee &&
      startDate &&
      termMonths &&
      currency // **Include Currency in Calculation Check**
    );
  };

  /**
   * Fetch list of currencies using currency-codes
   */
  const getCurrencyOptions = () => {
    const codes = CurrencyCodes.codes(); // Get array of currency codes
    return codes.map((code) => ({
      code: code,
      name: `${code} - ${CurrencyCodes.code(code)?.currency || "Unknown Currency"}`,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {/* Loan ID - always non-editable */}
      <div>
        <label htmlFor="loanID" className="block text-gray-700 font-medium">
          Loan ID:
        </label>
        <input
          id="loanID"
          name="loanID"
          value={formData.loanID}
          onChange={handleChange}
          disabled
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Client dropdown */}
      <div>
        <label htmlFor="clientID" className="block text-gray-700 font-medium">
          Client:
        </label>
        <select
          id="clientID"
          name="clientID"
          value={formData.clientID}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Select a Client --</option>
          {clients.map((client) => (
            <option key={client._id} value={client._id}>
              {client.name}
            </option>
          ))}
        </select>
      </div>

      {/* Loan Amount */}
      <div>
        <label htmlFor="loanAmount" className="block text-gray-700 font-medium">
          Loan Amount:
        </label>
        <input
          type="text"
          id="loanAmount"
          name="loanAmount"
          value={formData.loanAmount}
          onChange={handleChange}
          placeholder="Enter the principal amount"
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Currency Dropdown */}
      <div>
        <label htmlFor="currency" className="block text-gray-700 font-medium">
          Currency:
        </label>
        <select
          id="currency"
          name="currency"
          value={formData.currency}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        >
          <option value="">-- Select Currency --</option>
          {getCurrencyOptions().map((currency) => (
            <option key={currency.code} value={currency.code}>
              {currency.name}
            </option>
          ))}
        </select>
      </div>

      {/* Interest Rate */}
      <div>
        <label
          htmlFor="interestRate"
          className="block text-gray-700 font-medium"
        >
          Interest Rate:
          <span className="ml-1 text-xs text-gray-500">
            (0.05 => 5%, 0.1 => 10%)
          </span>
        </label>
        <input
          type="text"
          id="interestRate"
          name="interestRate"
          value={formData.interestRate}
          onChange={handleChange}
          placeholder="e.g. 0.05 => 5%"
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Start Date */}
      <div>
        <label htmlFor="startDate" className="block text-gray-700 font-medium">
          Start Date:
        </label>
        <input
          type="date"
          id="startDate"
          name="startDate"
          value={formData.startDate}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Repayment Terms (Term Months) */}
      <div>
        <label htmlFor="termMonths" className="block text-gray-700 font-medium">
          Repayment Terms (Months):
        </label>
        <input
          type="number"
          id="termMonths"
          name="termMonths"
          value={formData.termMonths}
          onChange={handleChange}
          placeholder="Enter number of repayment months"
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
          min="1"
        />
      </div>

      {/* End Date - Automatically Calculated */}
      <div>
        <label htmlFor="endDate" className="block text-gray-700 font-medium">
          End Date:
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          disabled
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 cursor-not-allowed"
        />
      </div>

      {/* Admin Fee (0.05 => 5%) */}
      <div>
        <label htmlFor="adminFee" className="block text-gray-700 font-medium">
          Admin Fee (One-Time Fee):
          <span className="ml-1 text-xs text-gray-500">
            (0.05 => 5%, 0.1 => 10%)
          </span>
        </label>
        <input
          type="text"
          id="adminFee"
          name="adminFee"
          value={formData.adminFee}
          onChange={handleChange}
          placeholder="e.g. 0.05 => 5%"
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
        <h3 className="text-lg font-semibold mb-2">Loan Summary</h3>
        {!canCalculate() ? (
          <p className="text-red-500">
            Please ensure all fields are correctly filled out to see the loan
            summary.
          </p>
        ) : (
          <>
            <p>
              <strong>Repayment Terms:</strong>{" "}
              {formData.termMonths} month{formData.termMonths > 1 ? "s" : ""}
            </p>
            <p>
              <strong>Interest Earned:</strong>{" "}
              {formatNumber(calculateInterestEarned())}
            </p>
            <p>
              <strong>Admin Fee (One-Time):</strong>{" "}
              {formatNumber(calculateAdminFeeAmount())}
            </p>
            <p>
              <strong>Monthly Required Amount:</strong>{" "}
              {formatNumber(calculateMonthlyAmount())}
            </p>
            <p>
              <strong>End Date:</strong> {formData.endDate || "N/A"}
            </p>
            <p>
              <strong>Currency:</strong> {formData.currency}
            </p> {/* **Display Selected Currency** */}
          </>
        )}
      </div>

      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting || !canCalculate()}
          className={`w-full p-2 rounded-md text-white font-semibold transition-all ${
            isSubmitting || !canCalculate()
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
        >
          {isSubmitting
            ? "Saving..."
            : existingLoan
            ? "Update Loan"
            : "Create Loan"}
        </button>
      </div>
    </form>
  );
}

export default LoanForm;
