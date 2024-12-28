// src/components/PaymentCard.js

import React from "react";
import { formatNumber } from "../utils/formatNumber";

const PaymentCard = ({ payment, onViewDetails }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 hover:shadow-xl transition-shadow duration-300 flex flex-col items-center">
      <h3 className="text-lg font-bold text-gray-800 mb-2">Payment ID: {payment.paymentID}</h3>
      <p className="text-gray-600 mb-1">Loan ID: {payment.loanID}</p>
      <p className="text-gray-600 mb-1">Client ID: {payment.clientID}</p>
      <p className="text-gray-600 mb-1">Amount: ${formatNumber(payment.amount)}</p>
      <p className="text-gray-600 mb-1">
        Interest Earned: ${payment.interestEarned ? formatNumber(payment.interestEarned) : "0.00"}
      </p>
      <p className="text-gray-600 mb-1">
        Outstanding Balance: ${payment.outstandingBalance ? formatNumber(payment.outstandingBalance) : "0.00"}
      </p>
      <p className="text-gray-600 mb-1">
        Admin Fee: ${payment.adminFee ? formatNumber(payment.adminFee) : "0.00"}
      </p>
      <button
        onClick={() => onViewDetails(payment)}
        className="mt-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
      >
        View Payment Details
      </button>
    </div>
  );
};

export default PaymentCard;
