// ./components/LoanTable.js
import React, { useState, useEffect, useMemo, useCallback } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Notification from "./Notification";
import Modal from "./Modal";
import LoanForm from "./LoanForm";
import LoanView from "./LoanView";
import { formatNumber } from "../utils/formatNumber";

/**
 * LoanTable - Manages loans and displays them in a table with delete functionality.
 *
 * Features:
 * - Fetches loans and their associated client names.
 * - Allows viewing, editing, creating, and deleting loans through modals.
 * - Displays notifications for various actions.
 */
function LoanTable() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]); // Fetch and store client data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit" | "create" | "delete"
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [notification, setNotification] = useState(null);

  // Delete Confirmation States
  const [paymentsCount, setPaymentsCount] = useState(0);
  const [totalPaymentsAmount, setTotalPaymentsAmount] = useState(0);

  /**
   * Fetch clients from the server
   */
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("http://13.246.7.5:5000/api/clients");
      if (!response.ok) {
        throw new Error(`Error fetching clients: ${response.status}`);
      }
      const { data } = await response.json();
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
      setNotification({ type: "error", message: "Failed to load clients." });
    }
  }, []);

  /**
   * Fetch loans from the server and map client names
   */
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://13.246.7.5:5000/api/loans");
      if (!response.ok) {
        throw new Error(`Error fetching loans: ${response.status}`);
      }
      const { data } = await response.json();

      // Map client names to loans
      const loansWithClientNames = data.map((loan) => {
        const client = clients.find((c) => c._id === loan.clientID);
        return {
          ...loan,
          clientName: client ? client.name : "Unknown Client",
        };
      });

      setLoans(loansWithClientNames);
    } catch (err) {
      setError(err.message);
      setNotification({ type: "error", message: "Failed to load loans." });
    } finally {
      setLoading(false);
    }
  }, [clients]);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  useEffect(() => {
    if (clients.length > 0) {
      fetchLoans();
    }
  }, [clients, fetchLoans]);

  /**
   * Open Modal in specified mode
   */
  const openModal = (mode, loan = null) => {
    setModalMode(mode);
    setSelectedLoan(loan);
    setNotification(null);

    if (mode === "delete" && loan) {
      fetchPaymentsData(loan.loanID);
    }

    setIsModalOpen(true);
  };

  /**
   * Close Modal and reset states
   */
  const closeModal = () => {
    setSelectedLoan(null);
    setIsModalOpen(false);
    setNotification(null);
    setModalMode("view");
    setPaymentsCount(0);
    setTotalPaymentsAmount(0);
  };

  /**
   * Fetch payments associated with a loan to display in delete confirmation
   */
  const fetchPaymentsData = async (loanID) => {
    try {
      const response = await fetch(`http://13.246.7.5:5000/api/payments?loanID=${loanID}`);
      if (!response.ok) {
        throw new Error(`Error fetching payments: ${response.status}`);
      }
      const { data } = await response.json();
      setPaymentsCount(data.length);
      const totalAmount = data.reduce((acc, payment) => acc + (payment.amount || 0), 0);
      setTotalPaymentsAmount(totalAmount.toFixed(2));
    } catch (err) {
      console.error("Error fetching payments:", err);
      setNotification({ type: "error", message: "Failed to load payments data." });
      setPaymentsCount(0);
      setTotalPaymentsAmount(0);
    }
  };

  /**
   * Handle Submit for Create/Edit Loan
   */
  const handleSubmitLoan = async (loanData) => {
    try {
      let url = "http://13.246.7.5:5000/api/loans";
      let method = "POST";

      if (selectedLoan && selectedLoan._id) {
        url = `http://13.246.7.5:5000/api/loans/${selectedLoan._id}`;
        method = "PUT";
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loanData),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to save loan details.");
      }

      setNotification({ type: "success", message: "Loan saved successfully!" });
      await fetchLoans();
    } catch (error) {
      console.error("Error saving loan:", error);
      setNotification({ type: "error", message: error.message });
      throw error; // Re-throw to let the form handle it
    }
  };

  /**
   * Handle Delete Loan
   */
  const handleDeleteLoan = async () => {
    if (!selectedLoan) return;

    try {
      const response = await fetch(`http://13.246.7.5:5000/api/loans/${selectedLoan._id}`, {
        method: "DELETE",
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Failed to delete loan.");
      }

      setNotification({ type: "success", message: "Loan deleted successfully!" });
      await fetchLoans();
      closeModal();
    } catch (error) {
      console.error("Error deleting loan:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  /**
   * Table columns with Delete Action
   */
  const columns = useMemo(
    () => [
      { Header: "Loan ID", accessor: "loanID" },
      {
        Header: "Client",
        accessor: "clientName", // Use clientName mapped earlier
      },
      { Header: "Amount ($)", accessor: "loanAmount", Cell: ({ value }) => formatNumber(value) },
      {
        Header: "Interest Rate",
        accessor: "interestRate",
        Cell: ({ value }) =>
          value ? `${(parseFloat(value) * 100).toFixed(2)}%` : "N/A",
      },
      {
        Header: "Admin Fee",
        accessor: "adminFee",
        Cell: ({ value }) =>
          value ? `${(parseFloat(value) * 100).toFixed(2)}%` : "N/A",
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) => (value ? new Date(value).toLocaleDateString() : "N/A"),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="flex space-x-2">
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
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Loans</h2>
        <button
          onClick={() => openModal("create", null)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Loan
        </button>
      </div>

      {/* Description */}
      <p className="text-gray-500 mb-4">
        Manage all your loans in one convenient table. Use "View" for a read-only summary,
        "Edit" to update details, or "Delete" to remove a loan.
      </p>

      {/* Notifications */}
      {notification && (
        <Notification type={notification.type} message={notification.message} />
      )}

      {/* Global Data Table */}
      <GlobalDataTable
        title="Loan Directory"
        columns={columns}
        data={loans}
        loading={loading}
        error={error}
        initialPageSize={10}
      />

      {/* Modal for View/Edit/Create/Delete */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={closeModal}
          title={
            modalMode === "create"
              ? "Create a New Loan"
              : modalMode === "edit"
              ? `Edit Loan: ${selectedLoan?.loanID || ""}`
              : modalMode === "view"
              ? `View Loan: ${selectedLoan?.loanID || ""}`
              : `Delete Loan: ${selectedLoan?.loanID || ""}`
          }
          description={
            modalMode === "create"
              ? "Fill out the required fields to create a new loan."
              : modalMode === "edit"
              ? "Modify the details of the selected loan."
              : modalMode === "view"
              ? "Review the details of this loan."
              : "Confirm the deletion of this loan and understand the implications."
          }
          notification={notification}
        >
          {modalMode === "view" && <LoanView loan={selectedLoan} />}

          {(modalMode === "edit" || modalMode === "create") && (
            <LoanForm
              existingLoan={modalMode === "edit" ? selectedLoan : null}
              onSubmit={handleSubmitLoan}
              onClose={closeModal}
              setNotification={setNotification}
            />
          )}

          {modalMode === "delete" && (
            <div className="space-y-4">
              <p>
                Are you sure you want to delete the loan <strong>{selectedLoan?.loanID}</strong>?
              </p>
              <p>
                This action will delete <strong>{paymentsCount}</strong> payment
                {paymentsCount !== 1 ? "s" : ""} associated with this loan, totaling
                <strong> ${formatNumber(totalPaymentsAmount)}</strong>.
              </p>
              <div className="flex justify-end space-x-2">
                <button
                  onClick={handleDeleteLoan}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
                >
                  Confirm Delete
                </button>
                <button
                  onClick={closeModal}
                  className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}

/**
 * Utility function to format numbers with thousand separators and fixed decimals.
 * If not already imported, ensure to import from utils/formatNumber.js
 */
const formatNumber = (value, decimalPlaces = 2) => {
  if (value === "" || value === null || value === undefined) return "";
  const number = parseFloat(value);
  if (isNaN(number)) return value; // Return original value if not a number
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces,
  }).format(number);
};

export default LoanTable;
