// src/components/LoanView.js

import React from "react";
import PropTypes from "prop-types"; // **For Prop Types Validation**
import { Tooltip } from "react-tooltip"; // **Assuming you have a Tooltip component installed**
import "react-tooltip/dist/react-tooltip.css"; // **Tooltip styles**

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
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b pb-2">
        <h2 className="text-2xl font-semibold text-gray-800">Loan Details</h2>
        <p className="text-sm text-gray-500">
          <span className="font-medium text-gray-700">Loan ID:</span> {loan.loanID}
        </p>
      </div>

      {/* Loan Information Section */}
      <div className="sm:grid-cols-2 gap-4">
        {/* Client Information */}

        {/* Loan Amount */}
        <div className="bg-green-50 p-4 rounded-lg shadow">
          <h3 className="text-lg font-medium text-green-800 mb-2">Financial Details</h3>
          <p>
            <span className="font-medium text-green-700">Loan Amount:</span> ${loan.loanAmount.toLocaleString()}
          </p>
          <p>
            <span className="font-medium text-green-700">Interest Rate:</span> {displayedInterest}{" "}
            <span
              data-tooltip-id="interest-tooltip"
              data-tooltip-content="Interest rate applied to the principal amount."
              className="text-blue-400 cursor-pointer"
            >
              ℹ️
            </span>
            <Tooltip id="interest-tooltip" place="top" effect="solid" />
          </p>
          <p>
            <span className="font-medium text-green-700">Admin Fee:</span> {displayedAdminFee}{" "}
            <span
              data-tooltip-id="adminfee-tooltip"
              data-tooltip-content="One-time administrative fee for processing the loan."
              className="text-blue-400 cursor-pointer"
            >
              ℹ️
            </span>
            <Tooltip id="adminfee-tooltip" place="top" effect="solid" />
          </p>
        </div>
      </div>

      {/* Repayment Schedule Section */}
      <div className="bg-yellow-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-yellow-800 mb-2">Repayment Schedule</h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <p>
            <span className="font-medium text-yellow-700">Start Date:</span>{" "}
            {loan.startDate ? loan.startDate.slice(0, 10) : "N/A"}
          </p>
          <p>
            <span className="font-medium text-yellow-700">End Date:</span>{" "}
            {loan.endDate ? loan.endDate.slice(0, 10) : "N/A"}
          </p>
          <p>
            <span className="font-medium text-yellow-700">Repayment Terms:</span>{" "}
            {loan.termMonths} {loan.termMonths > 1 ? "Months" : "Month"}
          </p>
        </div>
      </div>

      {/* Summary Section */}
      <div className="bg-purple-50 p-4 rounded-lg shadow">
        <h3 className="text-lg font-medium text-purple-800 mb-2">Loan Summary</h3>
        <div className="space-y-1">
          <p>
            <span className="font-medium text-purple-700">Total Interest Earned:</span>{" "}
            ${(loan.loanAmount * loan.interestRate).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p>
            <span className="font-medium text-purple-700">Admin Fee Amount:</span>{" "}
            ${(loan.loanAmount * loan.adminFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <p>
            <span className="font-medium text-purple-700">Total Payable:</span>{" "}
            ${(loan.loanAmount + loan.loanAmount * loan.interestRate + loan.loanAmount * loan.adminFee).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>
      </div>
    </div>
  );
}

// **PropTypes Validation**
LoanView.propTypes = {
  loan: PropTypes.shape({
    loanID: PropTypes.string.isRequired,
    clientID: PropTypes.string.isRequired,
    loanAmount: PropTypes.number.isRequired,
    interestRate: PropTypes.number.isRequired,
    adminFee: PropTypes.number.isRequired,
    startDate: PropTypes.string.isRequired,
    endDate: PropTypes.string.isRequired,
    termMonths: PropTypes.number.isRequired,
  }),
};

LoanView.defaultProps = {
  loan: null,
};

export default LoanView;
