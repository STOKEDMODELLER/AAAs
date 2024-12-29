import React, { useState, useEffect } from "react";

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
  });
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [loanDetails, setLoanDetails] = useState(null);
  const [paymentTerms, setPaymentTerms] = useState([]);
  const [allTermDetails, setAllTermDetails] = useState([]); // Store all terms
  const [expectedAmount, setExpectedAmount] = useState(0);
  const [interestForTerm, setInterestForTerm] = useState(0);
  const [totalExpectedForTerm, setTotalExpectedForTerm] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

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
        ...existingPayment,
        amount: existingPayment.amount.toFixed(2),
        outstandingBalance: existingPayment.outstandingBalance?.toFixed(2) || "",
        interestEarned: existingPayment.interestEarned?.toFixed(2) || "",
        scheduledDate: existingPayment.scheduledDate?.split("T")[0] || "",
        paymentDate: existingPayment.paymentDate?.split("T")[0] || "",
      });
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
        }));
        return;
      }

      try {
        const response = await fetch(`http://13.246.7.5:5000/api/loans/loans_by_LID/${formData.loanID}`);
        if (!response.ok) throw new Error("Failed to fetch loan details.");
        const { data } = await response.json();
        setLoanDetails(data);

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

  const calculateAllTermDetails = (loan) => {
    if (!loan) {
      console.error("Loan object is undefined");
      return [];
    }
  
    const terms = [];
    const loanAmount = parseFloat(loan.loanAmount || 0); // Default to 0 if undefined
    const termMonths = parseInt(loan.termMonths || 12, 10); // Default to 12 months if undefined
    const interestRate = parseFloat(loan.interestRate || 0); // Default to 0 if undefined
    const adminFeeRate = parseFloat(loan.adminFee || 0); // Default to 0 if undefined
    const monthlyInterestRate = interestRate / 12;
  
    const totalAdminFee = loanAmount * adminFeeRate; // Calculate total admin fee
    const adminFeePerTerm = totalAdminFee / termMonths; // Distribute admin fee evenly
    const principalPerTerm = loanAmount / termMonths; // Principal for each term
  
    let balance = loanAmount;
  
    for (let term = 1; term <= termMonths; term++) {
      const interest = parseFloat((balance * monthlyInterestRate).toFixed(2)); // Calculate monthly interest
      const total = parseFloat((principalPerTerm + interest + adminFeePerTerm).toFixed(2)); // Total includes admin fee
      const scheduledDate = new Date(new Date(loan.startDate).setMonth(new Date(loan.startDate).getMonth() + term - 1));
  
      terms.push({
        term,
        scheduledDate,
        principal: parseFloat(principalPerTerm.toFixed(2)),
        interest,
        adminFee: parseFloat(adminFeePerTerm.toFixed(2)),
        total,
      });
  
      balance -= principalPerTerm; // Reduce balance by the principal amount
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
          scheduledDate: termDetails.scheduledDate.toISOString().split("T")[0],
        }));
        setExpectedAmount(termDetails.total);
        setInterestForTerm(termDetails.interest);
        setTotalExpectedForTerm(termDetails.total);
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
        outstandingBalance: parseFloat(formData.outstandingBalance),
        interestEarned: parseFloat(formData.interestEarned),
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
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg shadow-md">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                {loan.loanID} - {parseFloat(loan.loanAmount).toFixed(2)}
              </option>
            ))}
          </select>
          {errors.loanID && <p className="text-red-500 text-sm">{errors.loanID}</p>}
        </div>

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

      <div className="p-4 bg-gray-50 border border-gray-300 rounded-md shadow-md">
        <h3 className="text-lg font-semibold text-gray-700">Term Summary</h3>
        <p className="text-gray-600 mt-2">
          <strong>Expected Amount:</strong> {expectedAmount.toFixed(2)}
        </p>
        <p className="text-gray-600 mt-2">
          <strong>Interest for Term:</strong> {interestForTerm.toFixed(2)}
        </p>
        <p className="text-gray-600 mt-2">
          <strong>Admin Fee for Term:</strong> {allTermDetails.find(t => t.term === parseInt(formData.paymentTerm))?.adminFee.toFixed(2) || "0.00"}
        </p>

        <p className="text-gray-600 mt-2">
          <strong>Total Expected for Term:</strong> {totalExpectedForTerm.toFixed(2)}
        </p>
      </div>


      <div>
        <label htmlFor="amount" className="block text-gray-700 font-medium mb-1">
          Payment Amount:
        </label>
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
        />
        {errors.amount && <p className="text-red-500 text-sm">{errors.amount}</p>}
      </div>

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
