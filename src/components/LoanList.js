import React, { useState, useEffect, useMemo, useCallback } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Notification from "./Notification";
import Modal from "./Modal";
import LoanForm from "./LoanForm";
import LoanView from "./LoanView";

/**
 * LoanList: Manages loans and displays them in a table.
 * - Fetches loans and their associated client names.
 * - Allows viewing, editing, and creating loans through modals.
 */
function LoanList({ loans, fetchLoans }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // For client data
  const [clients, setClients] = useState([]);

  // For modals (view/edit/create)
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view");
  const [selectedLoan, setSelectedLoan] = useState(null);

  // Notification for modal
  const [notification, setNotification] = useState(null);

  /**
   * Fetch clients and map their data
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
    }
  }, []);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /**
   * Opens the modal in the specified mode.
   */
  const openModal = (mode, loan = null) => {
    setModalMode(mode);
    setSelectedLoan(loan);
    setNotification(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedLoan(null);
    setIsModalOpen(false);
    setNotification(null);
    setModalMode("view");
  };

  /**
   * Submits a new or updated loan
   */
  const handleSubmitLoan = async (loanData) => {
    try {
      const isEdit = !!(selectedLoan && selectedLoan._id);
      let url = "http://13.246.7.5:5000/api/loans";
      let method = "POST";

      if (isEdit) {
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
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    }
  };

  /**
   * Maps the client name to each loan
   */
  const loansWithClientNames = useMemo(() => {
    return loans.map((loan) => {
      const client = clients.find((c) => c._id === loan.clientID);
      return {
        ...loan,
        clientName: client ? client.name : "Unknown Client",
      };
    });
  }, [loans, clients]);

  /**
   * Table columns for the GlobalDataTable
   */
  const columns = useMemo(
    () => [
      { Header: "Loan ID", accessor: "loanID" },
      {
        Header: "Client",
        accessor: "clientName", // Use mapped client name
      },
      { Header: "Amount", accessor: "loanAmount" },
      {
        Header: "Interest",
        accessor: "interestRate",
        Cell: ({ value }) => {
          if (!value) return "N/A";
          const percent = (parseFloat(value) * 100).toFixed(2);
          return `${percent}%`;
        },
      },
      {
        Header: "Admin Fee",
        accessor: "adminFee",
        Cell: ({ value }) => {
          if (!value) return "N/A";
          const percent = (parseFloat(value) * 100).toFixed(2);
          return `${percent}%`;
        },
      },
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
            </div>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header Row for adding a new Loan */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Loans</h2>
        <button
          onClick={() => openModal("create")}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Loan
        </button>
      </div>

      <p className="text-gray-500 mb-4">
        Manage all of your loans in one convenient table. Use "View" for a
        read-only summary, or "Edit" to update any details. Remember that
        interest and admin fee are decimals: e.g. 0.1 => 10% or 0.05 => 5%.
      </p>

      {loading && <Notification type="info" message="Loading data..." />}
      {error && <Notification type="error" message={error} />}

      {/* Global Data Table */}
      <GlobalDataTable
        title="Loan Table"
        columns={columns}
        data={loansWithClientNames}
        loading={loading}
        error={error}
        onGlobalFilterChange={() => {}}
        initialPageSize={5}
      />

      {/* Modal for viewing / editing / creating */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          modalMode === "create"
            ? "Create a New Loan"
            : modalMode === "edit"
            ? `Edit Loan: ${selectedLoan?.loanID || ""}`
            : `View Loan: ${selectedLoan?.loanID || ""}`
        }
        description={
          modalMode === "create"
            ? "Fill out the required fields for your new loan. For interest or admin fee, use decimals (0.1 => 10%)."
            : modalMode === "edit"
            ? "Revise the loan details below, especially decimals for interest/admin fee. Then click 'Update Loan'."
            : "Here is a read-only overview of this loan."
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
      </Modal>
    </div>
  );
}

export default LoanList;
