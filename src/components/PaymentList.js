// src/components/PaymentList.js

import React, { useState, useEffect, useMemo } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Modal from "./Modal";
import PaymentForm from "./PaymentForm";
import PaymentDetails from "./PaymentDetails";
import Notification from "./Notification";
import { formatCurrency } from "../utils/formatNumber"; // **Importing the Utility Function**
import PropTypes from "prop-types"; // **For Prop Types Validation**

const PaymentList = ({ clients = [], refreshTrigger }) => {
  const [payments, setPayments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notification, setNotification] = useState(null);
  const [loans, setLoans] = useState({}); // **Map loanID to currency**

  /**
   * Fetch all loans and create a mapping from loanID to currency
   */
  const fetchLoans = async () => {
    try {
      const response = await fetch("http://13.246.7.5:5000/api/loans");
      if (!response.ok) throw new Error("Failed to fetch loans.");
      const { data } = await response.json();
      // Create a mapping: loanID -> currency
      const loanMap = {};
      data.forEach((loan) => {
        loanMap[loan.loanID] = loan.currency || "USD"; // **Default to USD if currency is missing**
      });
      setLoans(loanMap);
    } catch (error) {
      console.error("Error fetching loans:", error);
      setNotification({ type: "error", message: "Could not load loan data." });
    }
  };

  /**
   * Fetch all payments from the server
   */
  const fetchPayments = async () => {
    try {
      const response = await fetch("http://13.246.7.5:5000/api/payments");
      if (!response.ok) throw new Error("Failed to fetch payments.");
      const { data } = await response.json();
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setNotification({ type: "error", message: "Could not load payments." });
    }
  };

  /**
   * Initialize data on component mount and when refreshTrigger changes
   */
  useEffect(() => {
    fetchLoans();
    fetchPayments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshTrigger]); // **Re-fetch when refreshTrigger changes**

  // Modal controls
  const openAddPaymentModal = () => {
    setIsModalOpen(true);
    setIsEditMode(false);
    setSelectedPayment(null);
    setNotification(null);
  };

  const openEditPaymentModal = (payment) => {
    setIsModalOpen(true);
    setIsEditMode(true);
    setSelectedPayment(payment);
    setNotification(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setNotification(null);
  };

  /**
   * Add or Edit payment submission
   */
  const handleAddOrEditPaymentSubmit = async (paymentData) => {
    try {
      const url = isEditMode
        ? `http://13.246.7.5:5000/api/payments/${selectedPayment._id}`
        : "http://13.246.7.5:5000/api/payments";
      const method = isEditMode ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(paymentData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error saving payment.");
      }

      setNotification({
        type: "success",
        message: isEditMode
          ? "Payment updated successfully!"
          : "Payment added successfully!",
      });

      // Refresh payments by leveraging the refreshTrigger in the parent
      // This can be handled by the parent component incrementing the refreshTrigger
      // For this, you might need to lift the refresh function up if necessary
      // However, since refreshTrigger is a prop, the parent will handle re-fetching

      closeModal();
    } catch (error) {
      console.error("Error saving payment:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  /**
   * Delete payment
   */
  const handleDeletePayment = async (paymentID) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      // Fetch the payment by paymentID to get its _id
      const responseGet = await fetch(
        `http://13.246.7.5:5000/api/payments?paymentID=${paymentID}`
      );
      if (!responseGet.ok) {
        throw new Error("Failed to fetch payment details for deletion.");
      }

      const { data: paymentData } = await responseGet.json();
      if (!paymentData || paymentData.length === 0) {
        throw new Error("Payment not found.");
      }

      const paymentToDelete = paymentData[0]._id; // Use the actual MongoDB ObjectId

      // Delete the payment using its _id
      const responseDelete = await fetch(
        `http://13.246.7.5:5000/api/payments/${paymentToDelete}`,
        {
          method: "DELETE",
        }
      );

      const result = await responseDelete.json();
      if (!responseDelete.ok) {
        throw new Error(result.message || "Error deleting payment.");
      }

      setNotification({
        type: "success",
        message: "Payment deleted successfully!",
      });

      // Refresh payments by leveraging the refreshTrigger in the parent
      // Similar to handleAddOrEditPaymentSubmit, the parent will handle re-fetching

    } catch (error) {
      console.error("Error deleting payment:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  /**
   * View payment details
   */
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCloseDetails = () => {
    setSelectedPayment(null);
  };

  /**
   * Helper function to map clientID to clientName
   */
  const getClientName = (clientID) => {
    const client = clients.find((c) => c._id === clientID); // Use `_id` for matching
    return client ? client.name : "Unknown Client";
  };

  /**
   * Utility function for formatting currency using Intl.NumberFormat
   */
  const formatCurrencyAmount = (amount, currencyCode) => {
    if (isNaN(amount)) return "0.00";

    try {
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    } catch (error) {
      console.error(`Invalid currency code "${currencyCode}":`, error);
      // Fallback to USD if currency code is invalid
      return new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: "USD",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(amount);
    }
  };

  // Columns for the table
  const columns = useMemo(
    () => [
      {
        Header: "Payment ID",
        accessor: "paymentID",
      },
      {
        Header: "Loan ID",
        accessor: "loanID",
      },
      {
        Header: "Client Name",
        accessor: "clientID",
        Cell: ({ value }) => getClientName(value),
      },
      {
        Header: "Scheduled Date",
        accessor: "scheduledDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "N/A",
      },
      {
        Header: "Payment Date",
        accessor: "paymentDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "N/A",
      },
      {
        Header: "Amount",
        accessor: "amount",
        Cell: ({ row }) => {
          const currencyCode = loans[row.original.loanID] || "USD"; // **Use loan's currency**
          return formatCurrencyAmount(row.original.amount, currencyCode);
        },
      },
      {
        Header: "Outstanding Balance",
        accessor: "outstandingBalance",
        Cell: ({ row }) => {
          const currencyCode = loans[row.original.loanID] || "USD"; // **Use loan's currency**
          return formatCurrencyAmount(row.original.outstandingBalance, currencyCode);
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="space-x-2">
            <button
              onClick={() => handleViewDetails(row.original)}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              View
            </button>
            <button
              onClick={() => openEditPaymentModal(row.original)}
              className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
            >
              Edit
            </button>
            <button
              onClick={() => handleDeletePayment(row.original.paymentID)}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [clients, loans]
  );

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Payments</h2>
        <button
          onClick={openAddPaymentModal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Payment
        </button>
      </div>

      {notification && (
        <Notification type={notification.type} message={notification.message} />
      )}

      <GlobalDataTable columns={columns} data={payments || []} title="Payments" />

      {/* Add/Edit Payment Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={isEditMode ? "Edit Payment" : "Add New Payment"}
          description={
            isEditMode
              ? "Update the details of the payment below."
              : "Fill out the form below to create a new payment."
          }
        >
          <PaymentForm
            existingPayment={isEditMode ? selectedPayment : null}
            onSubmit={handleAddOrEditPaymentSubmit}
            onClose={closeModal}
            setNotification={setNotification}
          />
        </Modal>
      )}

      {/* View Payment Details Modal */}
      {selectedPayment && !isEditMode && (
        <Modal
          isOpen={!!selectedPayment}
          onClose={handleCloseDetails}
          title="Payment Details"
        >
          <PaymentDetails payment={selectedPayment} onClose={handleCloseDetails} />
        </Modal>
      )}
    </div>
  );
};

// **PropTypes Validation**
PaymentList.propTypes = {
  clients: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      // Add other client properties if needed
    })
  ),
  refreshTrigger: PropTypes.number, // **Used to trigger re-fetching**
};

PaymentList.defaultProps = {
  clients: [],
  refreshTrigger: 0,
};

export default PaymentList;
