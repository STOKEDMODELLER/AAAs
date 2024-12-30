// src/components/Report.js

import React, { useEffect, useState } from "react";

const Report = ({
  selectedClient,
  selectedLoan,
  payments = [],
  clients = [],
  loans = [],
  setSelectedClient,
  setSelectedLoan,
}) => {
  const [sortedPayments, setSortedPayments] = useState([]);
  const [sortConfig, setSortConfig] = useState({ key: "paymentDate", direction: "descending" });

  /**
   * Calculate Projected Payments using standard amortization
   * @returns {Array} Projected Payments Schedule
   */
  const calculateProjectedPayments = () => {
    if (!selectedLoan) return [];
    const { interestRate, loanAmount, termMonths = 12 } = selectedLoan;

    // Convert interest rate from percentage to decimal if necessary
    // Assuming interestRate is in percentage form (e.g., 0.1793 for 0.1793% APR)
    const monthlyInterestRate = interestRate / 12; // 0.1793 / 12 = 0.0149416667%

    // Validate termMonths to avoid division by zero
    if (termMonths <= 0) return [];

    // Calculate fixed monthly payment using the amortization formula
    const fixedMonthlyPayment =
      (loanAmount * monthlyInterestRate) /
      (1 - Math.pow(1 + monthlyInterestRate, -termMonths));

    const roundedFixedMonthlyPayment = parseFloat(fixedMonthlyPayment.toFixed(2));

    let balance = loanAmount;
    const projectedPayments = [];

    for (let term = 1; term <= termMonths; term++) {
      const interestPayment = parseFloat((balance * monthlyInterestRate).toFixed(2));
      const principalPayment = parseFloat((roundedFixedMonthlyPayment - interestPayment).toFixed(2));

      // Adjust the last payment to account for rounding errors
      const finalPrincipalPayment =
        term === termMonths ? parseFloat(balance.toFixed(2)) : principalPayment;
      const finalTotalPayment =
        term === termMonths
          ? parseFloat((finalPrincipalPayment + interestPayment).toFixed(2))
          : parseFloat(roundedFixedMonthlyPayment.toFixed(2));

      const endingBalance =
        term === termMonths
          ? 0
          : parseFloat((balance - finalPrincipalPayment).toFixed(2));

      projectedPayments.push({
        term,
        paymentDate: new Date(new Date().setMonth(new Date().getMonth() + term)),
        paymentAmount: term === termMonths ? finalTotalPayment : roundedFixedMonthlyPayment,
        principal: term === termMonths ? finalPrincipalPayment : principalPayment,
        interest: interestPayment,
        remainingBalance: endingBalance,
        beginningBalance: balance,
      });

      balance = endingBalance;
    }

    return projectedPayments;
  };

  const projectedPayments = calculateProjectedPayments();

  useEffect(() => {
    if (!sortConfig) return;
    const { key, direction } = sortConfig;
    setSortedPayments(
      [...payments].sort((a, b) => {
        if (a[key] < b[key]) return direction === "ascending" ? -1 : 1;
        if (a[key] > b[key]) return direction === "ascending" ? 1 : -1;
        return 0;
      })
    );
  }, [payments, sortConfig]);

  const handlePrint = () => {
    const printContent = document.getElementById("printable-report");
    const originalContent = document.body.innerHTML;

    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload();
  };

  const requestSort = (key) => {
    setSortConfig((prevConfig) => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === "ascending" ? "descending" : "ascending",
    }));
  };

  const filteredLoans = loans.filter((loan) => loan.clientID === selectedClient?._id);

  // Calculate Totals for Payments Made
  const totalPaymentsAmount = payments.reduce((sum, payment) => sum + (payment.amount || 0), 0);

  // Calculate Totals for Projected Payments
  const totalProjectedPayment = projectedPayments.reduce((sum, payment) => sum + (payment.paymentAmount || 0), 0);
  const totalProjectedPrincipal = projectedPayments.reduce((sum, payment) => sum + (payment.principal || 0), 0);
  const totalProjectedInterest = projectedPayments.reduce((sum, payment) => sum + (payment.interest || 0), 0);

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div id="printable-report" className="bg-white p-8 rounded-lg shadow-lg space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Generate Comprehensive Report</h2>
        <p className="text-gray-600">
          Select a client and their associated loan to view detailed payment histories and projections.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="client-select" className="block text-lg font-medium text-gray-700 mb-2">
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
            <label htmlFor="loan-select" className="block text-lg font-medium text-gray-700 mb-2">
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

        {selectedClient && selectedLoan && (
          <>
            <div className="space-y-6">
              {/* Client Details */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">Client Details</h3>
                <p>
                  <strong>Name:</strong> {selectedClient.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedClient.email}
                </p>
                <p>
                  <strong>Contact Number:</strong> {selectedClient.contactNumber || "N/A"}
                </p>
                <p>
                  <strong>Address:</strong> {selectedClient.address || "N/A"}
                </p>
              </div>
              {/* Loan Details */}
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">Loan Details</h3>
                <p>
                  <strong>Loan ID:</strong> {selectedLoan.loanID}
                </p>
                <p>
                  <strong>Loan Amount:</strong> ${selectedLoan.loanAmount.toLocaleString()}
                </p>
                <p>
                  <strong>Interest Rate:</strong> {selectedLoan.interestRate}% APR
                </p>
                <p>
                  <strong>Repayment Terms:</strong> {selectedLoan.termMonths || 12} months
                </p>
                {/* If Admin Fee is still relevant, include it */}
                {/* <p>
                  <strong>Admin Fee:</strong> {(selectedLoan.adminFee * 100).toFixed(2)}%
                </p> */}
              </div>
            </div>

            {/* Payments Made Section */}
            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Payments Made</h3>
              {sortedPayments.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Payment Date
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Amount
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
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
                          {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.amount !== undefined
                            ? `$${payment.amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.outstandingBalance !== undefined
                            ? `$${payment.outstandingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : '0.00'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.description || "N/A"}</td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-200 font-semibold">
                      <td className="py-4 px-6 text-sm text-gray-700">Total</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {totalPaymentsAmount !== undefined
                          ? `$${totalPaymentsAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">No payments recorded for this loan.</p>
              )}
            </div>

            {/* Projected Payments Section */}
            <div className="overflow-x-auto mt-6">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Projected Payment Schedule</h3>
              {projectedPayments.length > 0 ? (
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
                        Payment Amount
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Principal
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Interest
                      </th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">
                        Ending Balance
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectedPayments.map((payment) => (
                      <tr key={payment.term} className="border-t">
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.term}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.paymentDate ? payment.paymentDate.toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.paymentAmount !== undefined
                            ? `$${payment.paymentAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.principal !== undefined
                            ? `$${payment.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.interest !== undefined
                            ? `$${payment.interest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-700">
                          {payment.remainingBalance !== undefined
                            ? `$${payment.remainingBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'N/A'}
                        </td>
                      </tr>
                    ))}
                    {/* Totals Row */}
                    <tr className="bg-gray-200 font-semibold">
                      <td className="py-4 px-6 text-sm text-gray-700">Totals</td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {totalProjectedPayment !== undefined
                          ? `$${totalProjectedPayment.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {totalProjectedPrincipal !== undefined
                          ? `$${totalProjectedPrincipal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">
                        {totalProjectedInterest !== undefined
                          ? `$${totalProjectedInterest.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : '-'}
                      </td>
                      <td className="py-4 px-6 text-sm text-gray-700">-</td>
                    </tr>
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600">No projected payments available for this loan.</p>
              )}
            </div>
          </>
        )}

        <div className="flex justify-end">
          <button
            onClick={handlePrint}
            className="bg-blue-500 text-white py-3 px-6 rounded-lg hover:bg-blue-600 transition"
          >
            Print Report
          </button>
        </div>
      </div>
    </div>
  );
};

export default Report;
