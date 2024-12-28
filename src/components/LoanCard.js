import React from "react";

/**
 * LoanCard - A simple card showcasing key loan info.
 *
 * Props:
 * - loan (required): The loan object containing fields like _id, loanID, loanAmount, etc.
 * - onEdit (required): A function triggered when the user wants to edit this loan
 */
function LoanCard({ loan, onEdit }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-800">Loan ID: {loan.loanID}</h3>
      <p className="text-gray-600 mt-2">Loan Amount: ${loan.loanAmount}</p>

      <div className="mt-4 flex gap-2">
        <button className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition duration-200">
          View Loan Details
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
        >
          Edit Loan
        </button>
      </div>
    </div>
  );
}

export default LoanCard;
