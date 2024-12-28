import React, { useState, useEffect } from "react";
import { MathComponent } from "mathjax-react";
// Utility function to generate a unique Payment ID
const generatePaymentID = () => {
  const randomDigits = Math.floor(100000 + Math.random() * 900000);
  return `PMT-${randomDigits}`;
};

// PaymentForm Component
const PaymentForm = ({ existingPayment, onSubmit, onClose, setNotification }) => {
  // State for form data
  const [formData, setFormData] = useState({
    paymentID: "",
    loanID: "",
    clientID: "",
    scheduledDate: "",
    paymentDate: "",
    amount: "",
    outstandingBalance: "",
    interestEarned: "",
    description: "",
  });
  const [showFormulaDetails, setShowFormulaDetails] = useState(false);

  // State for clients, loans, loan details, and past payments
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [pastPayments, setPastPayments] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // State to track delinquency
  const [isDelinquent, setIsDelinquent] = useState(false);
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [paymentTowardsPrincipal, setPaymentTowardsPrincipal] = useState(0);
  const [paymentTowardsInterest, setPaymentTowardsInterest] = useState(0);

  // Fetch clients on component mount
  useEffect(() => {
    const fetchClients = async () => {
      console.log("Fetching clients...");
      try {
        const response = await fetch(`http://13.246.7.5:5000/api/clients`);
        if (!response.ok) throw new Error("Failed to fetch clients.");
        const { data } = await response.json();
        setClients(data);
        console.log("Clients fetched successfully:", data);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setNotification({ type: "error", message: "Could not load clients." });
      }
    };

    fetchClients();

    // Initialize paymentID if creating a new payment
    if (!existingPayment) {
      const newPaymentID = generatePaymentID();
      setFormData((prev) => ({ ...prev, paymentID: newPaymentID }));
      console.log("Generated new Payment ID:", newPaymentID);
    } else {
      // Populate form with existing payment data for editing
      setFormData({
        ...existingPayment,
        amount: existingPayment.amount.toFixed(2),
        outstandingBalance: existingPayment.outstandingBalance?.toFixed(2) || "",
        interestEarned: existingPayment.interestEarned?.toFixed(2) || "",
        scheduledDate: existingPayment.scheduledDate?.split("T")[0] || "",
        paymentDate: existingPayment.paymentDate?.split("T")[0] || "",
      });
      console.log("Loaded existing payment data:", existingPayment);
    }
  }, [existingPayment, setNotification]);

  // Fetch loans when clientID changes
  useEffect(() => {
    const fetchLoans = async () => {
      if (!formData.clientID) {
        console.log("No client selected. Skipping loan fetch.");
        return;
      }

      console.log(`Fetching loans for Client ID: ${formData.clientID}...`);
      try {
        const response = await fetch(`http://13.246.7.5:5000/api/loans`);
        if (!response.ok) throw new Error("Failed to fetch loans.");
        const { data } = await response.json();
        const filteredLoans = data.filter((loan) => loan.clientID === formData.clientID);
        setLoans(filteredLoans);
        console.log(`Loans fetched for Client ID ${formData.clientID}:`, filteredLoans);
      } catch (error) {
        console.error("Error fetching loans:", error);
        setNotification({ type: "error", message: "Could not load loans for the selected client." });
      }
    };

    fetchLoans();
  }, [formData.clientID, setNotification]);

  // Fetch loan details and past payments when loanID changes
  useEffect(() => {
    const fetchLoanDetails = async () => {
      if (!formData.loanID) {
        console.log("No loan selected. Skipping loan details fetch.");
        setLoanDetails(null);
        setPastPayments([]);
        setFormData((prev) => ({
          ...prev,
          outstandingBalance: "",
          interestEarned: "",
        }));
        setIsDelinquent(false);
        setExpectedAmount(0);
        setPaymentTowardsPrincipal(0);
        setPaymentTowardsInterest(0);
        return;
      }

      console.log(`Fetching details and payments for Loan ID: ${formData.loanID}...`);
      try {
        const [loanResponse, paymentsResponse] = await Promise.all([
          fetch(`http://13.246.7.5:5000/api/loans/loans_by_LID/${formData.loanID}`),
          fetch(`http://13.246.7.5:5000/api/payments?loanID=${formData.loanID}`),
        ]);

        if (!loanResponse.ok) throw new Error("Failed to fetch loan details.");
        if (!paymentsResponse.ok) throw new Error("Failed to fetch past payments.");

        const loanData = await loanResponse.json();
        // Map termMonths to loanTerm and ensure it's a number
        const mappedLoanData = {
          ...loanData.data,
          loanTerm: parseInt(loanData.data.termMonths, 10),
        };
        setLoanDetails(mappedLoanData);
        console.log("Loan details fetched:", mappedLoanData);

        const paymentsData = await paymentsResponse.json();
        setPastPayments(paymentsData.data);
        console.log("Past payments fetched:", paymentsData.data);

        // Perform initial calculations once loan details and past payments are fetched
        if (mappedLoanData && paymentsData.data) {
          performCalculations(mappedLoanData, paymentsData.data);
        }
      } catch (error) {
        console.error("Error fetching loan details or past payments:", error);
        setNotification({ type: "error", message: "Could not load loan details or past payments." });
      }
    };

    fetchLoanDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.loanID]);

  /**
   * Helper function to calculate the total number of terms (months) that have passed.
   * @param {string} startDate - The loan start date in YYYY-MM-DD format.
   * @param {string} paymentDate - The payment date in YYYY-MM-DD format.
   * @returns {number} - The total number of full months between startDate and paymentDate.
   */
  const calculateTotalTerms = (startDate, paymentDate) => {
    const start = new Date(startDate);
    const payment = new Date(paymentDate);

    let months =
      (payment.getFullYear() - start.getFullYear()) * 12 +
      (payment.getMonth() - start.getMonth());

    if (payment.getDate() < start.getDate()) {
      months -= 1;
    }

    const totalTerms = months > 0 ? months : 0;
    console.log(`Calculated Total Terms: ${totalTerms} months`);
    return totalTerms;
  };

  /**
   * Helper function to calculate total interest based on the number of terms.
   * @param {number} loanAmount - The principal loan amount.
   * @param {number} annualInterestRate - The annual interest rate (e.g., 0.1 for 10%).
   * @param {number} totalTerms - The total number of terms (months).
   * @returns {number} - The total interest over all terms.
   */
  const calculateTotalInterest = (loanAmount, annualInterestRate, totalTerms) => {
    const monthlyInterestRate = annualInterestRate / 12;
    const totalInterest = parseFloat((loanAmount * monthlyInterestRate * totalTerms).toFixed(2));
    console.log(`Calculated Total Interest: $${totalInterest}`);
    return totalInterest;
  };

  /**
   * Helper function to calculate interest per term.
   * @param {number} totalInterest - The total interest over all terms.
   * @param {number} totalTerms - The total number of terms.
   * @returns {number} - The interest earned per term.
   */
  const calculateInterestPerTerm = (totalInterest, totalTerms) => {
    if (totalTerms === 0) return 0;
    const interestPerTerm = parseFloat((totalInterest / totalTerms).toFixed(2));
    console.log(`Calculated Interest Per Term: $${interestPerTerm}`);
    return interestPerTerm;
  };

  /**
   * Helper function to calculate the outstanding balance.
   * @param {number} loanAmount - The principal loan amount.
   * @param {number} totalInterest - The total interest over all terms.
   * @param {number} totalPaid - The total amount paid to date.
   * @returns {string} - The outstanding balance formatted to two decimal places.
   */
  const calculateOutstandingBalance = (loanAmount, totalInterest, totalPaid) => {
    const outstanding = loanAmount + totalInterest - totalPaid;
    const formattedOutstanding = outstanding > 0 ? outstanding.toFixed(2) : "0.00";
    console.log(`Calculated Outstanding Balance: $${formattedOutstanding}`);
    return formattedOutstanding;
  };

  /**
   * Perform all necessary calculations for the payment summary.
   * @param {Object} loan - The loan details.
   * @param {Array} payments - Array of past payments.
   */
  const performCalculations = (loan, payments) => {
    console.log("Performing calculations for payment summary...");

    // Determine the latest payment date or use current date if no payments
    const latestPayment = payments.length
      ? payments.reduce((latest, payment) =>
          new Date(payment.paymentDate) > new Date(latest.paymentDate) ? payment : latest
        )
      : null;

    const paymentDate = latestPayment
      ? latestPayment.paymentDate
      : loan.startDate.split("T")[0];

    console.log(`Payment Date for Calculations: ${paymentDate}`);

    const totalTerms = calculateTotalTerms(loan.startDate.split("T")[0], paymentDate);
    const totalInterest = calculateTotalInterest(
      parseFloat(loan.loanAmount),
      parseFloat(loan.interestRate),
      totalTerms
    );
    const interestPerTerm = calculateInterestPerTerm(totalInterest, totalTerms);
    const totalPaid = payments.reduce((acc, p) => acc + parseFloat(p.amount), 0);

    console.log(`Total Amount Paid to Date: $${totalPaid}`);

    const outstanding = calculateOutstandingBalance(
      parseFloat(loan.loanAmount),
      totalInterest,
      totalPaid
    );

    // Calculate expected monthly payment (principal)
    const monthlyPayment = loan.loanTerm ? parseFloat((loan.loanAmount / loan.loanTerm).toFixed(2)) : 0;
    console.log(`Loan Term: ${loan.loanTerm}`);
    if (loan.loanTerm === 0 || isNaN(monthlyPayment)) {
      console.error("Invalid loan term. Cannot calculate monthly payment.");
      setNotification({ type: "error", message: "Invalid loan term. Please check loan details." });
      return;
    }
    const expectedMonthlyAmount = monthlyPayment + interestPerTerm;
    console.log(`Monthly Payment (Principal): $${monthlyPayment.toFixed(2)}`);
    console.log(`Expected Monthly Amount (Principal + Interest): $${expectedMonthlyAmount.toFixed(2)}`);

    // Calculate expected total payment
    const expectedTotalPayment = expectedMonthlyAmount * totalTerms;
    console.log(`Expected Total Payment: $${expectedTotalPayment.toFixed(2)}`);

    // Calculate unpaid terms
    const unpaidTerms = Math.ceil((expectedTotalPayment - totalPaid) / expectedMonthlyAmount);
    console.log(`Unpaid Terms: ${unpaidTerms} month(s)`);

    // Determine delinquency
    if (unpaidTerms > 0) {
      setIsDelinquent(true);
      const newExpectedAmount = unpaidTerms * expectedMonthlyAmount;
      setExpectedAmount(newExpectedAmount);
      console.log(`Delinquent: Yes, Expected Amount to Catch Up: $${newExpectedAmount.toFixed(2)}`);

      // Update description with delinquency message if not already present
      const delinquencyMessage = `Delinquency Notice: You have unpaid payments for ${unpaidTerms} month(s) totaling $${newExpectedAmount.toFixed(2)}. Expected Monthly Amount: $${expectedMonthlyAmount.toFixed(2)}.`;
      if (!formData.description.includes(delinquencyMessage)) {
        setFormData((prev) => ({
          ...prev,
          description: prev.description
            ? `${prev.description}\n${delinquencyMessage}`
            : delinquencyMessage,
        }));
        console.log("Added delinquency message to description.");
      }
    } else {
      setIsDelinquent(false);
      setExpectedAmount(0);
      console.log("Delinquent: No");
      // Optionally, remove delinquency message from description
      const delinquencyMessage = "Delinquency Notice:";
      if (formData.description.includes(delinquencyMessage)) {
        const updatedDescription = formData.description
          .split("\n")
          .filter((line) => !line.startsWith(delinquencyMessage))
          .join("\n");
        setFormData((prev) => ({
          ...prev,
          description: updatedDescription,
        }));
        console.log("Removed delinquency message from description.");
      }
    }

    setFormData((prev) => ({
      ...prev,
      outstandingBalance: outstanding,
      interestEarned: interestPerTerm,
    }));

    console.log("Payment Summary Updated:", {
      outstandingBalance: outstanding,
      interestEarned: interestPerTerm,
    });
  };

  /**
   * Handle changes in form inputs.
   * @param {Object} e - The event object.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;

    console.log(`Form Field Changed: ${name} = ${value}`);

    // Update formData state
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Recalculate outstanding balance and interest earned if relevant fields change
    if ((name === "amount" || name === "paymentDate") && loanDetails) {
      const paymentAmount = name === "amount" ? parseFloat(value) : parseFloat(formData.amount) || 0;
      const paymentDate = name === "paymentDate" ? value : formData.paymentDate || new Date().toISOString().split("T")[0];

      console.log(`Recalculating based on ${name} change: Payment Amount = $${paymentAmount}, Payment Date = ${paymentDate}`);

      if (paymentDate) {
        const totalTerms = calculateTotalTerms(loanDetails.startDate.split("T")[0], paymentDate);
        const totalInterest = calculateTotalInterest(parseFloat(loanDetails.loanAmount), parseFloat(loanDetails.interestRate), totalTerms);
        const interestPerTerm = calculateInterestPerTerm(totalInterest, totalTerms);
        const monthlyPayment = loanDetails.loanTerm ? parseFloat((loanDetails.loanAmount / loanDetails.loanTerm).toFixed(2)) : 0;

        console.log(`Loan Term: ${loanDetails.loanTerm}`);
        if (loanDetails.loanTerm === 0 || isNaN(monthlyPayment)) {
          console.error("Invalid loan term. Cannot calculate monthly payment.");
          setNotification({ type: "error", message: "Invalid loan term. Please check loan details." });
          return;
        }

        const expectedMonthlyAmount = monthlyPayment + interestPerTerm;
        console.log(`Monthly Payment (Principal): $${monthlyPayment.toFixed(2)}`);
        console.log(`Expected Monthly Amount (Principal + Interest): $${expectedMonthlyAmount.toFixed(2)}`);

        const totalPaid = pastPayments.reduce((acc, p) => acc + parseFloat(p.amount), 0) + paymentAmount;

        console.log(`Total Paid after current input: $${totalPaid}`);

        const outstanding = calculateOutstandingBalance(parseFloat(loanDetails.loanAmount), totalInterest, totalPaid);

        // Calculate expected total payment based on terms
        const expectedTotalPayment = expectedMonthlyAmount * totalTerms;
        console.log(`Expected Total Payment: $${expectedTotalPayment.toFixed(2)}`);

        // Calculate unpaid terms
        const unpaidTerms = Math.ceil((expectedTotalPayment - totalPaid) / expectedMonthlyAmount);
        console.log(`Unpaid Terms: ${unpaidTerms} month(s)`);

        // Determine delinquency
        if (unpaidTerms > 0) {
          setIsDelinquent(true);
          const newExpectedAmount = unpaidTerms * expectedMonthlyAmount;
          setExpectedAmount(newExpectedAmount);
          console.log(`Delinquent: Yes, Expected Amount to Catch Up: $${newExpectedAmount.toFixed(2)}`);

          // Update description with delinquency message if not already present
          const delinquencyMessage = `Delinquency Notice: You have unpaid payments for ${unpaidTerms} month(s) totaling $${newExpectedAmount.toFixed(2)}. Expected Monthly Amount: $${expectedMonthlyAmount.toFixed(2)}.`;
          if (!formData.description.includes(delinquencyMessage)) {
            setFormData((prev) => ({
              ...prev,
              description: prev.description
                ? `${prev.description}\n${delinquencyMessage}`
                : delinquencyMessage,
            }));
            console.log("Added delinquency message to description.");
          }
        } else {
          setIsDelinquent(false);
          setExpectedAmount(0);
          console.log("Delinquent: No");

          // Optionally, remove delinquency message from description
          const delinquencyMessage = "Delinquency Notice:";
          if (formData.description.includes(delinquencyMessage)) {
            const updatedDescription = formData.description
              .split("\n")
              .filter((line) => !line.startsWith(delinquencyMessage))
              .join("\n");
            setFormData((prev) => ({
              ...prev,
              description: updatedDescription,
            }));
            console.log("Removed delinquency message from description.");
          }
        }

        setFormData((prev) => ({
          ...prev,
          outstandingBalance: outstanding,
          interestEarned: interestPerTerm,
        }));

        console.log("Updated Payment Summary:", {
          outstandingBalance: outstanding,
          interestEarned: interestPerTerm,
        });
      } else {
        console.log("Insufficient data for calculations. Resetting Payment Summary.");
        setFormData((prev) => ({
          ...prev,
          outstandingBalance: "",
          interestEarned: "",
        }));
      }
    }
  };

  /**
   * Handle form submission.
   * @param {Object} e - The event object.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("Form submission initiated.");

    // Validate required fields
    const requiredFields = [
      "paymentID",
      "loanID",
      "clientID",
      "scheduledDate",
      "paymentDate",
      "amount",
      "outstandingBalance",
    ];

    for (let field of requiredFields) {
      if (!formData[field] && formData[field] !== 0) {
        console.error(`Validation Error: ${field} is required.`);
        setNotification({ type: "error", message: "Please fill in all required fields." });
        return;
      }
    }

    setIsSubmitting(true);
    console.log("Form is submitting...");

    try {
      // Prepare data for submission
      const submissionData = {
        paymentID: formData.paymentID,
        loanID: formData.loanID,
        clientID: formData.clientID,
        scheduledDate: formData.scheduledDate,
        paymentDate: formData.paymentDate,
        amount: parseFloat(formData.amount),
        outstandingBalance: parseFloat(formData.outstandingBalance),
        interestEarned: parseFloat(formData.interestEarned),
        description: formData.description,
      };

      console.log("Submitting Payment Data:", submissionData);

      // Submit the payment data
      await onSubmit(submissionData);

      // Notify success and close the form
      setNotification({ type: "success", message: "Payment successfully submitted." });
      console.log("Payment submitted successfully.");
      onClose();
    } catch (error) {
      console.error("Error submitting payment:", error);
      // Notify failure
      setNotification({ type: "error", message: "Failed to submit payment." });
    } finally {
      setIsSubmitting(false);
      console.log("Form submission ended.");
    }
  };

  // Dynamic label for Amount field
  const amountLabel = isDelinquent
    ? `Amount ($${expectedAmount.toFixed(2)} payment due ):`
    : "Amount (Payment towards Principal and Interest):";

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      {/* Two-Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column */}
        <div>
          {/* Payment ID */}
          <div>
            <label htmlFor="paymentID" className="block text-gray-700 font-medium mb-1">
              Payment ID:
            </label>
            <input
              type="text"
              id="paymentID"
              name="paymentID"
              value={formData.paymentID}
              readOnly
              className="w-full px-4 py-2 border border-gray-300 rounded-md bg-gray-100"
            />
          </div>

          {/* Client Selection */}
          <div className="mt-4">
            <label htmlFor="clientID" className="block text-gray-700 font-medium mb-1">
              Client:
            </label>
            <select
              id="clientID"
              name="clientID"
              value={formData.clientID}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
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

          {/* Scheduled Date */}
          <div className="mt-4">
            <label htmlFor="scheduledDate" className="block text-gray-700 font-medium mb-1">
              Scheduled Date:
            </label>
            <input
              type="date"
              id="scheduledDate"
              name="scheduledDate"
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
        </div>

        {/* Right Column */}
        <div>
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
              disabled={!formData.clientID}
            >
              <option value="">-- Select a Loan --</option>
              {loans.map((loan) => (
                <option key={loan.loanID} value={loan.loanID}>
                  {loan.loanID} - ${parseFloat(loan.loanAmount).toFixed(2)}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Date */}
          <div className="mt-4">
            <label htmlFor="paymentDate" className="block text-gray-700 font-medium mb-1">
              Payment Date:
            </label>
            <input
              type="date"
              id="paymentDate"
              name="paymentDate"
              value={formData.paymentDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>

          {/* Payment Amount */}
          <div className="mt-4">
            <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">
              {amountLabel}
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={formData.amount}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md"
              min="0"
              step="0.01"
              required
            />
          </div>
        </div>
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
        ></textarea>
      </div>

      {/* Payment Summary */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Payment Summary</h3>
        <div className="mt-2">
          {formData.loanID ? (
            loanDetails ? (
              <>
                <p className="text-gray-600">
                  <strong>Outstanding Balance:</strong> ${formData.outstandingBalance || "0.00"}
                </p>
                <p className="text-gray-600">
                  <strong>Interest Earned This Term:</strong> ${formData.interestEarned || "0.00"}
                </p>
                {isDelinquent && (
                  <p className="text-red-600 mt-2">
                    <strong>Delinquency Notice:</strong> You have unpaid payments totaling ${expectedAmount.toFixed(2)}.
                  </p>
                )}
              </>
            ) : (
              <p className="text-gray-600">Loading loan details...</p>
            )
          ) : (
            <p className="text-gray-600">Please select a loan to have the data displayed.</p>
          )}
        </div>
      </div>
      <div className="mt-6">
  <button
    type="button"
    onClick={() => setShowFormulaDetails(!showFormulaDetails)}
    className="text-blue-600 hover:underline"
  >
    {showFormulaDetails ? "Hide Payment Calculation Details" : "Show Payment Calculation Details"}
  </button>
  {showFormulaDetails && (
    <div
      className="mt-4 bg-gray-100 p-4 rounded-lg overflow-auto"
      style={{ maxHeight: "300px" }}
    >
      <h4 className="text-gray-700 font-medium">Calculation Formulas</h4>
      <div className="mt-2">
        <p className="text-gray-600 mt-2">
          <strong>Monthly Interest:</strong>
          <MathComponent
            tex={String.raw`\text{Monthly Interest} = \text{Outstanding Balance} \times \frac{\text{Annual Interest Rate}}{12}`}
            display={true}
          />
        </p>
        <p className="text-gray-600 mt-2">
          <strong>Monthly Principal:</strong>
          <MathComponent
            tex={String.raw`\text{Monthly Principal} = \frac{\text{Loan Amount}}{\text{Term Months}}`}
            display={true}
          />
        </p>
        <p className="text-gray-600 mt-2">
          <strong>Total Monthly Payment:</strong>
          <MathComponent
            tex={String.raw`\text{Total Payment} = \text{Monthly Principal} + \text{Monthly Interest}`}
            display={true}
          />
        </p>
      </div>
    </div>
  )}
</div>








      {/* Submit Button */}
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className={`w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition ${
            isSubmitting ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          {isSubmitting ? "Submitting..." : "Submit Payment"}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
