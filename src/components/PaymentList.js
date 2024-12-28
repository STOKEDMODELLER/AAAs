import React, { useState } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Modal from "./Modal";
import PaymentForm from "./PaymentForm";
import PaymentDetails from "./PaymentDetails";
import Notification from "./Notification";

const PaymentList = ({ payments, refreshPayments, clients = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [notification, setNotification] = useState(null);

  // Helper function to map clientID to clientName
  const getClientName = (clientID) => {
    const client = clients.find((c) => c._id === clientID); // Use `_id` for matching
    return client ? client.name : "Unknown Client";
  };

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

  // Add or Edit payment submission
  const handleAddOrEditPaymentSubmit = async (paymentData) => {
    try {
      const url = isEditMode
        ? `http://localhost:5000/api/payments/${selectedPayment._id}`
        : "http://localhost:5000/api/payments";
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
      await refreshPayments();
      closeModal();
    } catch (error) {
      console.error("Error saving payment:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  // Delete payment
  const handleDeletePayment = async (paymentID) => {
    if (!window.confirm("Are you sure you want to delete this payment?")) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:5000/api/payments/${paymentID}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Error deleting payment.");
      }

      setNotification({
        type: "success",
        message: "Payment deleted successfully!",
      });
      await refreshPayments();
    } catch (error) {
      console.error("Error deleting payment:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  // View payment details
  const handleViewDetails = (payment) => {
    setSelectedPayment(payment);
  };

  const handleCloseDetails = () => {
    setSelectedPayment(null);
  };

  // Columns for the table
  const columns = React.useMemo(
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
        Cell: ({ value }) => (value ? value.toLocaleString() : "0.00"),
      },
      {
        Header: "Outstanding Balance",
        accessor: "outstandingBalance",
        Cell: ({ value }) => (value ? value.toLocaleString() : "0.00"),
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
    [clients]
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

      <GlobalDataTable
        columns={columns}
        data={payments || []}
        title="Payments"
      />

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

export default PaymentList;
