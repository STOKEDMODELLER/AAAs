import React from "react";

/**
 * LoanView - A read-only display of a loan's details.
 *
 * Props:
 * - loan (required): The loan object to display
 */
function LoanView({ loan }) {
  if (!loan) return <p className="text-gray-500">No loan selected.</p>;

  // Convert interestRate from decimal to % if you want (e.g. 0.1 => "10%")
  // Similarly for adminFee
  const displayedInterest = loan.interestRate
    ? `${(loan.interestRate * 100).toFixed(2)}%`
    : "N/A";

  const displayedAdminFee = loan.adminFee
    ? `${(loan.adminFee * 100).toFixed(2)}%`
    : "N/A";

  return (
    <div className="space-y-2">
      <p>
        <strong>Loan ID:</strong> {loan.loanID}
      </p>
      <p>
        <strong>Client ID:</strong> {loan.clientID}
      </p>
      <p>
        <strong>Loan Amount:</strong> ${loan.loanAmount}
      </p>
      <p>
        <strong>Interest Rate:</strong> {displayedInterest}{" "}
        <span className="text-xs text-gray-500">
          (entered as decimal, e.g. 0.1 => 10%)
        </span>
      </p>
      <p>
        <strong>Admin Fee:</strong> {displayedAdminFee}{" "}
        <span className="text-xs text-gray-500">
          (0.05 => 5%, etc.)
        </span>
      </p>
      <p>
        <strong>Start Date:</strong>{" "}
        {loan.startDate ? loan.startDate.slice(0, 10) : "N/A"}
      </p>
      <p>
        <strong>End Date:</strong>{" "}
        {loan.endDate ? loan.endDate.slice(0, 10) : "N/A"}
      </p>
      <p>
        <strong>Repayment Months:</strong> {loan.termMonths || "N/A"}
      </p>
    </div>
  );
}

export default LoanView;
