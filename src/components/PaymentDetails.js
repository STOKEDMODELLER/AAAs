// src/components/PaymentDetails.js

import React from "react";
import { formatNumber } from "../utils/formatNumber";

const PaymentDetails = ({ payment, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-4 text-center">Payment Details</h2>
      <div className="space-y-3">
        <div>
          <h4 className="text-md font-semibold text-gray-700">Payment ID:</h4>
          <p className="text-gray-600">{payment.paymentID}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Loan ID:</h4>
          <p className="text-gray-600">{payment.loanID}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Client ID:</h4>
          <p className="text-gray-600">{payment.clientID}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Scheduled Date:</h4>
          <p className="text-gray-600">
            {payment.scheduledDate ? new Date(payment.scheduledDate).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Payment Date:</h4>
          <p className="text-gray-600">
            {payment.paymentDate ? new Date(payment.paymentDate).toLocaleDateString() : "N/A"}
          </p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Amount:</h4>
          <p className="text-gray-600">${formatNumber(payment.amount)}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Interest Earned:</h4>
          <p className="text-gray-600">${payment.interestEarned ? formatNumber(payment.interestEarned) : "0.00"}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Admin Fee:</h4>
          <p className="text-gray-600">${payment.adminFee ? formatNumber(payment.adminFee) : "0.00"}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Outstanding Balance:</h4>
          <p className="text-gray-600">${formatNumber(payment.outstandingBalance)}</p>
        </div>
        <div>
          <h4 className="text-md font-semibold text-gray-700">Description:</h4>
          <p className="text-gray-600">{payment.description || "N/A"}</p>
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button
          onClick={onClose}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition duration-200"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default PaymentDetails;
