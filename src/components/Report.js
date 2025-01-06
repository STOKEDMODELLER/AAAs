// src/components/Report.js

import React, { useEffect, useState } from "react";

/**
 * Report - A page that shows:
 * 1) Client & Loan selectors
 * 2) Payments made (fetched from the server using loanID)
 * 3) Projected Payment Schedule (simple interest) with an Admin Fee column
 */
const Report = ({
  selectedClient,
  selectedLoan,
  setSelectedClient,
  setSelectedLoan,
  clients = [],
  loans = [],
}) => {
  const [payments, setPayments] = useState([]); // We'll store fetched payments here
  const [sortConfig, setSortConfig] = useState({
    key: "paymentDate",
    direction: "descending",
  });

  /**
   * Whenever a new loan is selected, fetch all the latest payments for that loan.
   * Example GET endpoint: /api/payments?loanID={selectedLoan.loanID}
   */
  useEffect(() => {
    const fetchPaymentsForLoan = async () => {
      if (!selectedLoan?.loanID) {
        setPayments([]);
        return;
      }
      try {
        const response = await fetch(
          `http://13.246.7.5:5000/api/payments?loanID=${selectedLoan.loanID}`
        );
        const data = await response.json();
        if (data.success) {
          setPayments(data.data); // store the newly fetched payments
        } else {
          console.error("Failed to fetch payments for this loan.");
          setPayments([]);
        }
      } catch (error) {
        console.error("Error fetching payments:", error);
        setPayments([]);
      }
    };

    fetchPaymentsForLoan();
  }, [selectedLoan]);

  /**
   * Sort the payments based on sortConfig
   */
  const sortedPayments = React.useMemo(() => {
    if (!payments?.length) return [];
    const { key, direction } = sortConfig;
    // Create a copy of payments
    const paymentsCopy = [...payments];
    return paymentsCopy.sort((a, b) => {
      if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
      if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
      return 0;
    });
  }, [payments, sortConfig]);

  /**
   * Sorting helper
   */
  const requestSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction:
        prevConfig.key === key && prevConfig.direction === "ascending"
          ? "descending"
          : "ascending",
    }));
  };

  /**
   * Calculate Projected Payments using Simple Interest:
   * totalInterest = P × r × (termMonths / 12)
   * monthlyPayment = (P + totalInterest) / termMonths
   * monthlyPrincipal = P / termMonths
   * monthlyInterest = totalInterest / termMonths
   *
   * Also incorporate the admin fee (loanAmount * adminFeePercentage) in the first term.
   */
  const calculateProjectedPayments = () => {
    if (!selectedLoan) return [];

    const {
      interestRate, // e.g. 0.05 => 5%
      loanAmount,
      termMonths = 12,
      adminFee: adminFeePercentage = 0, // e.g. 0.05 => 5%
    } = selectedLoan;

    if (termMonths <= 0 || !loanAmount || !interestRate) return [];

    // Simple interest calculations
    const totalInterest = loanAmount * interestRate * (termMonths / 12);
    const monthlyInterest = totalInterest / termMonths;
    const monthlyPrincipal = loanAmount / termMonths;
    const monthlyPayment = monthlyPrincipal + monthlyInterest;

    // Admin fee as a one-time fee on the first term
    const oneTimeAdminFee = loanAmount * adminFeePercentage;

    let balance = loanAmount;
    const projectedPayments = [];

    for (let term = 1; term <= termMonths; term++) {
      // Interest and principal for this term
      const interestThisTerm = monthlyInterest;
      const principalThisTerm =
        term === termMonths
          ? balance // final term clears out the remaining principal
          : monthlyPrincipal;

      // Admin fee applies only in the first term
      const adminFeeThisTerm = term === 1 ? oneTimeAdminFee : 0;

      // Payment amount = monthlyPayment + admin fee for the first term
      const paymentAmount = monthlyPayment + adminFeeThisTerm;

      // For demonstration, let's assume each payment is 1 month apart from "now."
      const paymentDate = new Date();
      paymentDate.setMonth(paymentDate.getMonth() + term);

      // Remaining balance after paying principal
      const endingBalance =
        term === termMonths ? 0 : balance - principalThisTerm;

      projectedPayments.push({
        term,
        paymentDate,
        paymentAmount,
        principal: principalThisTerm,
        interest: interestThisTerm,
        adminFee: adminFeeThisTerm,
        remainingBalance: endingBalance,
        beginningBalance: balance,
      });

      balance = endingBalance;
    }

    return projectedPayments;
  };

  const projectedPayments = calculateProjectedPayments();

  // Summations for the Totals row in the Projected Payment Schedule
  const totalPayment = projectedPayments.reduce(
    (sum, p) => sum + p.paymentAmount,
    0
  );
  const totalPrincipal = projectedPayments.reduce(
    (sum, p) => sum + p.principal,
    0
  );
  const totalInterest = projectedPayments.reduce(
    (sum, p) => sum + p.interest,
    0
  );
  const totalAdminFee = projectedPayments.reduce(
    (sum, p) => sum + p.adminFee,
    0
  );

  /**
   * Print functionality
   */
  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  /**
   * Filter loans for the currently selected client
   */
  const filteredLoans = loans.filter(
    (loan) => loan.clientID === selectedClient?._id
  );

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div
        id="printable-report"
        className="bg-white p-8 rounded-lg shadow-lg space-y-8"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-800">
            Comprehensive Loan Report
          </h2>
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
          >
            Print
          </button>
        </div>
        <p className="text-gray-600">
          Select a client and their loan to view detailed payment histories,
          projected payments (simple interest), and analysis. The first term
          includes a one-time admin fee if applicable.
        </p>

        {/* Client & Loan Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label
              htmlFor="client-select"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Choose Client
            </label>
            <select
              id="client-select"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedClient?._id || ""}
              onChange={(e) => {
                const client = clients.find((c) => c._id === e.target.value);
                setSelectedClient(client);
                setSelectedLoan(null);
                setPayments([]); // reset payments if client changes
              }}
            >
              <option value="">-- Select a Client --</option>
              {clients.map((client) => (
                <option key={client._id} value={client._id}>
                  {client.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label
              htmlFor="loan-select"
              className="block text-lg font-medium text-gray-700 mb-2"
            >
              Choose Loan
            </label>
            <select
              id="loan-select"
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              value={selectedLoan?.loanID || ""}
              onChange={(e) => {
                const loan = loans.find((l) => l.loanID === e.target.value);
                setSelectedLoan(loan);
              }}
              disabled={!selectedClient}
            >
              <option value="">-- Select a Loan --</option>
              {filteredLoans.map((loan) => (
                <option key={loan.loanID} value={loan.loanID}>
                  {loan.loanID} - ${loan.loanAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Display Client & Loan Details */}
        {selectedClient && selectedLoan && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Client Details */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">
                  Client Details
                </h3>
                <p>
                  <strong>Name:</strong> {selectedClient.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedClient.email}
                </p>
                <p>
                  <strong>Contact Number:</strong>{" "}
                  {selectedClient.contactNumber || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {selectedClient.address || "N/A"}
                </p>
              </div>

              {/* Loan Details */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">
                  Loan Details
                </h3>
                <p>
                  <strong>Loan ID:</strong> {selectedLoan.loanID}
                </p>
                <p>
                  <strong>Loan Amount:</strong>{" "}
                  ${selectedLoan.loanAmount.toLocaleString()}
                </p>
                <p>
                  <strong>Interest Rate:</strong>{" "}
                  {(selectedLoan.interestRate * 100).toFixed(2)}% APR
                </p>
                <p>
                  <strong>Admin Fee (%):</strong>{" "}
                  {selectedLoan.adminFee
                    ? `${(selectedLoan.adminFee * 100).toFixed(2)}%`
                    : "0%"}
                </p>
                <p>
                  <strong>Repayment Terms:</strong>{" "}
                  {selectedLoan.termMonths || 12} months
                </p>
              </div>
            </div>

            {/* Payments Made - using the newest fetched data */}
            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Payments Made
              </h3>
              {sortedPayments.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th
                        onClick={() => requestSort("paymentDate")}
                        className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer"
                      >
                        Payment Date
                      </th>
                      <th
                        onClick={() => requestSort("amount")}
                        className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer"
                      >
                        Amount
                      </th>
                      <th
                        onClick={() => requestSort("outstandingBalance")}
                        className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase cursor-pointer"
                      >
                        Outstanding Balance
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment) => (
                      <tr key={payment._id} className="border-t">
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {new Date(payment.paymentDate).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          ${payment.amount.toLocaleString()}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          $
                          {payment.outstandingBalance
                            ? payment.outstandingBalance.toLocaleString()
                            : 0}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.description || "N/A"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">
                  No payments recorded for this loan.
                </p>
              )}
            </div>

            {/* Projected Payment Schedule (Simple Interest) with Admin Fee Column */}
            <div className="overflow-x-auto mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">
                Projected Payment Schedule (Simple Interest)
              </h3>
              <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Term
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Payment Date
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Principal
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Interest
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Admin Fee
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Payment Amount
                    </th>
                    <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                      Remaining Balance
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {projectedPayments.map((payment) => (
                    <tr key={payment.term} className="border-t">
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {payment.term}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {payment.paymentDate.toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {payment.principal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {payment.interest.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {payment.adminFee.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {payment.paymentAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {payment.remainingBalance.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                    </tr>
                  ))}
                  {/* Totals Row */}
                  {projectedPayments.length > 0 && (
                    <tr className="bg-gray-200 font-semibold">
                      <td className="py-4 px-6 text-sm text-gray-700">
                        Totals
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {totalPrincipal.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {totalInterest.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {totalAdminFee.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        $
                        {totalPayment.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                        })}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Report;
