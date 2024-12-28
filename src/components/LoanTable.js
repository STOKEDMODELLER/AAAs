import React, { useState, useEffect, useMemo, useCallback } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Notification from "./Notification";
import Modal from "./Modal";
import LoanForm from "./LoanForm";
import LoanView from "./LoanView";

function LoanTable() {
  const [loans, setLoans] = useState([]);
  const [clients, setClients] = useState([]); // Fetch and store client data
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("view"); // "view" | "edit" | "create"
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [notification, setNotification] = useState(null);

  /**
   * Fetch clients from the server
   */
  const fetchClients = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:5000/api/clients");
      if (!response.ok) {
        throw new Error(`Error fetching clients: ${response.status}`);
      }
      const { data } = await response.json();
      setClients(data || []);
    } catch (err) {
      console.error("Error fetching clients:", err);
    }
  }, []);

  /**
   * Fetch loans from the server and map client names
   */
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("http://localhost:5000/api/loans");
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

  const handleSubmitLoan = async (loanData) => {
    let url = "http://localhost:5000/api/loans";
    let method = "POST";

    if (selectedLoan && selectedLoan._id) {
      url = `http://localhost:5000/api/loans/${selectedLoan._id}`;
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
  };

  /**
   * Table columns
   */
  const columns = useMemo(
    () => [
      { Header: "Loan ID", accessor: "loanID" },
      {
        Header: "Client",
        accessor: "clientName", // Use clientName mapped earlier
      },
      { Header: "Amount", accessor: "loanAmount" },
      {
        Header: "Interest",
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
        Header: "Actions",
        Cell: ({ row }) => {
          const loan = row.original;
          return (
            <div className="space-x-2">
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
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Loans</h2>
        <button
          onClick={() => openModal("create", null)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Loan
        </button>
      </div>

      {loading && <Notification type="info" message="Loading data..." />}
      {error && <Notification type="error" message={error} />}

      <GlobalDataTable
        title="Loan Directory"
        columns={columns}
        data={loans}
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
            : `View Loan: ${selectedLoan?.loanID || ""}`
        }
        description={
          modalMode === "create"
            ? "Fill out the required fields for your new loan."
            : modalMode === "edit"
            ? "Modify this loan's details."
            : "Review this loan's details below."
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

export default LoanTable;
