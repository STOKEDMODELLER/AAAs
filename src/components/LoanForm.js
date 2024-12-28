import React, { useState, useEffect } from "react";

function LoanForm({ existingLoan, onSubmit, onClose, setNotification }) {
  const [formData, setFormData] = useState({
    loanID: "",
    clientID: "",
    loanAmount: "",
    interestRate: "",
    startDate: "",
    endDate: "",
    adminFee: "",
  });
  const [clients, setClients] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [termMonths, settermMonths] = useState("");

  // Helper to format numbers with commas
  const formatNumber = (value) => {
    if (!value) return "";
    const parts = value.toString().split(".");
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
  };

  // Helper to parse formatted numbers back to plain numbers
  const parseNumber = (value) => value.replace(/,/g, "");

  const generateRandomLoanID = () => {
    const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "LN";
    for (let i = 0; i < 6; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
  };

  const fetchClients = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/clients");
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

  const calculatetermMonths = (start, end) => {
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      console.error("Invalid dates provided.");
      return null;
    }

    if (endDate <= startDate) {
      console.error("End Date must be after Start Date.");
      return null;
    }

    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let totalMonths = years * 12 + months;

    if (endDate.getDate() < startDate.getDate()) {
      totalMonths -= 1;
    }

    return totalMonths > 0 ? totalMonths : null;
  };

  // Calculate interest earned
  const calculateInterestEarned = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const interestRate = parseFloat(formData.interestRate);
    if (isNaN(loanAmount) || isNaN(interestRate)) return null;
    return (loanAmount * interestRate).toFixed(2);
  };

  // Calculate admin fee amount
  const calculateAdminFeeAmount = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const adminFeePercentage = parseFloat(formData.adminFee);
    if (isNaN(loanAmount) || isNaN(adminFeePercentage)) return null;
    return (loanAmount * adminFeePercentage).toFixed(2);
  };

  // Calculate monthly required payment
  const calculateMonthlyAmount = () => {
    const loanAmount = parseFloat(parseNumber(formData.loanAmount));
    const interestEarned = parseFloat(calculateInterestEarned());
    const adminFeeAmount = parseFloat(calculateAdminFeeAmount());
    const termMonthsNum = parseInt(termMonths, 10);

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

  useEffect(() => {
    fetchClients();
    if (!existingLoan) {
      setFormData((prev) => ({ ...prev, loanID: generateRandomLoanID() }));
    }
  }, [existingLoan]);

  useEffect(() => {
    if (existingLoan) {
      setFormData({
        loanID: existingLoan.loanID || "",
        clientID: existingLoan.clientID || "",
        loanAmount: formatNumber(existingLoan.loanAmount),
        interestRate: existingLoan.interestRate || "",
        startDate: existingLoan.startDate?.split("T")[0] || "",
        endDate: existingLoan.endDate?.split("T")[0] || "",
        adminFee: formatNumber(existingLoan.adminFee),
      });

      if (existingLoan.startDate && existingLoan.endDate) {
        settermMonths(
          calculatetermMonths(
            existingLoan.startDate,
            existingLoan.endDate
          ) || ""
        );
      }
    }
  }, [existingLoan]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "loanAmount" || name === "adminFee") {
      const numericValue = value.replace(/[^0-9.]/g, "");
      setFormData((prev) => ({ ...prev, [name]: formatNumber(numericValue) }));
    } else if (name === "startDate" || name === "endDate") {
      const newFormData = { ...formData, [name]: value };
      setFormData(newFormData);

      const terms = calculatetermMonths(
        newFormData.startDate,
        newFormData.endDate
      );
      settermMonths(terms || "");
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { clientID, loanAmount, interestRate, startDate, endDate, adminFee } =
      formData;

    if (
      !clientID ||
      !loanAmount ||
      !interestRate ||
      !startDate ||
      !endDate ||
      !termMonths ||
      !adminFee
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
        termMonths: parseInt(termMonths, 10),
        loanAmount: parseFloat(parseNumber(formData.loanAmount)),
        interestRate: parseFloat(formData.interestRate),
        adminFee: parseFloat(parseNumber(formData.adminFee)),
      });
      onClose();
    } catch (err) {
      setNotification?.({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const canCalculate = () => {
    const { loanAmount, interestRate, adminFee, startDate, endDate } = formData;
    return (
      loanAmount &&
      interestRate &&
      adminFee &&
      startDate &&
      endDate &&
      termMonths
    );
  };

  return (
    <form onSubmit={handleSubmit}>
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
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
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

      {/* End Date */}
      <div>
        <label htmlFor="endDate" className="block text-gray-700 font-medium">
          End Date:
        </label>
        <input
          type="date"
          id="endDate"
          name="endDate"
          value={formData.endDate}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-white border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      {/* Repayment Terms (Read-Only) */}
      <div>
        <label
          htmlFor="termMonths"
          className="block text-gray-700 font-medium"
        >
          Number of Repayment Months:
        </label>
        <input
          type="text"
          id="termMonths"
          name="termMonths"
          value={termMonths ? termMonths : ""}
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
              <strong>Payment Terms:</strong>{" "}
              {termMonths} month{termMonths > 1 ? "s" : ""}
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
          </>
        )}
      </div>

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
    </form>
  );
}

export default LoanForm;
