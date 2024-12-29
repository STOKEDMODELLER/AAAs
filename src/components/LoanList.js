import React, { useState, useEffect, useMemo, useCallback } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Notification from "./Notification";
import Modal from "./Modal";
import LoanForm from "./LoanForm";
import LoanView from "./LoanView";

function LoanList({ loans, fetchLoans }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [payments, setPayments] = useState([]);
  const [notification, setNotification] = useState(null);

  // Fetch clients
  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch("http://13.246.7.5:5000/api/clients");
      if (!response.ok) throw new Error(`Failed to fetch clients: ${response.status}`);
      const { data } = await response.json();
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err.message);
      setError("Unable to load client data. Please try again later.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  // Fetch payments for a loan
  const fetchPaymentsByLoan = async (loanID) => {
    try {
      const response = await fetch(`http://13.246.7.5:5000/api/payments?loanID=${loanID}`);
      if (!response.ok) throw new Error(`Failed to fetch payments: ${response.status}`);
      const { data } = await response.json();
      return data;
    } catch (err) {
      console.error(`Error fetching payments for loan ${loanID}:`, err.message);
      return [];
    }
  };

  // Open modal with specified mode and loan
// Open modal with specified mode and loan
const openModal = async (mode, loan = null) => {
  setModalMode(mode);
  setSelectedLoan(loan);
  setNotification(null);

  if (mode === "delete" && loan) {
    const allPayments = await fetchAllPayments(); // Fetch all payments
    const relatedPayments = filterPaymentsByLoan(allPayments, loan.loanID); // Filter payments for the selected loan
    setPayments(relatedPayments); // Set related payments for statistics
  }
  setIsModalOpen(true);
};


  // Close modal
  const closeModal = () => {
    setSelectedLoan(null);
    setIsModalOpen(false);
    setNotification(null);
    setPayments([]);
    setModalMode("view");
  };

  // Handle create or edit loan submission
  const handleSubmitLoan = async (loanData) => {
    try {
      setLoading(true);
      const method = modalMode === "edit" ? "PUT" : "POST";
      const url =
        modalMode === "edit"
          ? `http://13.246.7.5:5000/api/loans/${selectedLoan._id}`
          : "http://13.246.7.5:5000/api/loans";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || "Failed to save loan details.");
      }

      setNotification({ type: "success", message: "Loan saved successfully!" });
      await fetchLoans(); // Refresh loans
      closeModal();
    } catch (err) {
      console.error("Error saving loan:", err.message);
      setNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Handle delete loan
  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;

    try {
      setLoading(true);
      const response = await fetch(`http://13.246.7.5:5000/api/loans/${selectedLoan._id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const { message } = await response.json();
        throw new Error(message || "Failed to delete loan.");
      }

      setNotification({ type: "success", message: "Loan deleted successfully!" });
      await fetchLoans(); // Refresh loans
      closeModal();
    } catch (err) {
      console.error(`Error deleting loan ${selectedLoan.loanID}:`, err.message);
      setNotification({ type: "error", message: err.message });
    } finally {
      setLoading(false);
    }
  };

  // Map client names to loans
  const loansWithClientNames = useMemo(() => {
    return loans.map((loan) => {
      const client = clients.find((c) => c._id === loan.clientID);
      return { ...loan, clientName: client ? client.name : "Unknown Client" };
    });
  }, [loans, clients]);
// Fetch all payments
const fetchAllPayments = async () => {
  try {
    const response = await fetch("http://13.246.7.5:5000/api/payments");
    if (!response.ok) throw new Error(`Failed to fetch payments: ${response.status}`);
    const { data } = await response.json();
    return data || [];
  } catch (err) {
    console.error("Error fetching payments:", err.message);
    return [];
  }
};

// Filter payments for the selected loan
const filterPaymentsByLoan = (allPayments, loanID) => {
  return allPayments.filter((payment) => payment.loanID === loanID);
};

  // Table columns
  const columns = useMemo(
    () => [
      { Header: "Loan ID", accessor: "loanID" },
      { Header: "Client", accessor: "clientName" },
      { Header: "Amount", accessor: "loanAmount" },
      { Header: "Interest", accessor: "interestRate", Cell: ({ value }) => `${(value * 100).toFixed(2)}%` },
      {
        Header: "Total Amount",
        accessor: "totalAmount",
        Cell: ({ row }) => {
          const loanAmount = parseFloat(row.original.loanAmount || 0);
          const interestRate = parseFloat(row.original.interestRate || 0);
          const totalAmount = loanAmount + loanAmount * interestRate;
          return `$${totalAmount.toFixed(2)}`;
        },
      },
      { Header: "Admin Fee", accessor: "adminFee", Cell: ({ value }) => `${(value * 100).toFixed(2)}%` },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex gap-2">
              <button
                onClick={() => openModal("view", loan)}
                className="px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
              >
                View
              </button>
              <button
                onClick={() => openModal("edit", loan)}
                className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
              >
                Edit
              </button>
              <button
                onClick={() => openModal("delete", loan)}
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600 transition"
              >
                Delete
              </button>
            </div>
          );
        },
      },
    ],
    [openModal]
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Loans</h2>
        <button
          onClick={() => openModal("create")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Loan
        </button>
      </div>

      {loading && <Notification type="info" message="Loading data..." />}
      {error && <Notification type="error" message={error} />}

      <GlobalDataTable
        title="Loan Table"
        columns={columns}
        data={loansWithClientNames}
        loading={loading}
        error={error}
        initialPageSize={5}
      />

      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === "create"
            ? "Create a New Loan"
            : modalMode === "edit"
            ? `Edit Loan: ${selectedLoan?.loanID || ""}`
            : modalMode === "delete"
            ? `Delete Loan: ${selectedLoan?.loanID || ""}`
            : `View Loan: ${selectedLoan?.loanID || ""}`
        }
        description={
          modalMode === "delete"
            ? `This loan has ${payments.length} associated payments totaling $${payments
                .reduce((sum, p) => sum + p.amount, 0)
                .toFixed(2)}. Deleting this loan will permanently remove all associated data.`
            : ""
        }
        notification={notification}
      >
        {modalMode === "create" || modalMode === "edit" ? (
          <LoanForm
            existingLoan={modalMode === "edit" ? selectedLoan : null}
            onSubmit={handleSubmitLoan}
            onClose={closeModal}
            setNotification={setNotification}
          />
        ) : modalMode === "view" ? (
          <LoanView loan={selectedLoan} />
        ) : modalMode === "delete" && (
          <div className="flex justify-end gap-2">
            <button
              onClick={closeModal}
              className="px-4 py-2 bg-gray-300 text-black rounded hover:bg-gray-400"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteLoan}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Confirm Delete
            </button>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default LoanList;
