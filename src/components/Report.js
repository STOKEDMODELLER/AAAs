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

  const calculateProjectedPayments = () => {
    if (!selectedLoan) return [];
    const { interestRate, loanAmount, termMonths = 12, adminFee = 0 } = selectedLoan;

    const monthlyPrincipal = loanAmount / termMonths; // Fixed monthly principal
    const monthlyInterestRate = interestRate / 12; // Convert annual interest rate to monthly
    const totalAdminFee = loanAmount * adminFee; // Calculate total admin fee
    const adminFeePerTerm = totalAdminFee / termMonths; // Distribute admin fee across terms

    let balance = loanAmount;
    const projectedPayments = [];

    for (let term = 1; term <= termMonths; term++) {
      const interest = parseFloat((balance * monthlyInterestRate).toFixed(2)); // Monthly interest
      const totalPayment = parseFloat((monthlyPrincipal + interest + adminFeePerTerm).toFixed(2)); // Total payment including admin fee
      balance = Math.max(parseFloat((balance - monthlyPrincipal).toFixed(2)), 0); // Update balance

      projectedPayments.push({
        term,
        date: new Date(new Date().setMonth(new Date().getMonth() + term)), // Future date
        principal: parseFloat(monthlyPrincipal.toFixed(2)),
        interest,
        adminFee: parseFloat(adminFeePerTerm.toFixed(2)), // Admin fee per term
        totalPayment,
        remainingBalance: balance,
      });
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

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
      <div id="printable-report" className="bg-white p-8 rounded-lg shadow-lg space-y-8">
        <h2 className="text-3xl font-bold text-gray-800">Generate Comprehensive Report</h2>
        <p className="text-gray-600">Select a client and their associated loan to view detailed payment histories and projections.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <label htmlFor="client-select" className="block text-lg font-medium text-gray-700 mb-2">Choose Client</label>
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
                <option key={client._id} value={client._id}>{client.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="loan-select" className="block text-lg font-medium text-gray-700 mb-2">Choose Loan</label>
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
                  {loan.loanID} - {loan.loanAmount.toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        </div>

        {selectedClient && selectedLoan && (
          <>
            <div className="space-y-6">
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">Client Details</h3>
                <p><strong>Name:</strong> {selectedClient.name}</p>
                <p><strong>Email:</strong> {selectedClient.email}</p>
                <p><strong>Contact Number:</strong> {selectedClient.contactNumber}</p>
              </div>
              <div className="bg-gray-50 p-6 rounded-lg shadow">
                <h3 className="text-xl font-semibold text-gray-800">Loan Details</h3>
                <p><strong>Loan ID:</strong> {selectedLoan.loanID}</p>
                <p><strong>Loan Amount:</strong> {selectedLoan.loanAmount.toLocaleString()}</p>
                <p><strong>Interest Rate:</strong> {(selectedLoan.interestRate * 100).toFixed(2)}%</p>
                <p><strong>Repayment Terms:</strong> {selectedLoan.termMonths || 12} months</p>
                <p><strong>Admin Fee:</strong> {selectedLoan.adminFee?.toLocaleString() || 0}</p>
              </div>
            </div>

            {/* Payments Made Section */}
            <div className="overflow-x-auto">
              <h3 className="text-xl font-semibold text-gray-800 mb-4">Payments Made</h3>
              {sortedPayments.length > 0 ? (
                <table className="min-w-full bg-white border border-gray-300 rounded-lg">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Payment Date</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Amount</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Outstanding Balance</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedPayments.map((payment) => (
                      <tr key={payment._id} className="border-t">
                        <td className="py-4 px-6 text-sm text-gray-700">{new Date(payment.paymentDate).toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.amount.toLocaleString()}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.outstandingBalance?.toLocaleString() || 0}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.description || "N/A"}</td>
                      </tr>
                    ))}
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
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Term</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Payment Date</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Principal</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Interest</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Admin Fee</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Total Payment</th>
                      <th className="py-3 px-6 text-left text-xs font-medium text-gray-700 uppercase">Remaining Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectedPayments.map((payment) => (
                      <tr key={payment.term} className="border-t">
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.term}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.date.toLocaleDateString()}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.principal.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.interest.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.adminFee.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.totalPayment.toFixed(2)}</td>
                        <td className="py-4 px-6 text-sm text-gray-700">{payment.remainingBalance.toFixed(2)}</td>
                      </tr>
                    ))}
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
