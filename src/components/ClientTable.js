import React, { useState, useEffect, useCallback, useMemo } from "react";
import GlobalDataTable from "./GlobalDataTable";
import Notification from "./Notification";
import Modal from "./Modal";
import AddClientForm from "./AddClientForm";

/**
 * ClientTable - displays and manages clients using the GlobalDataTable.
 * Features:
 *  - Fetch clients from server
 *  - Searching, sorting, pagination
 *  - Modal to add or edit a client
 */
function ClientTable() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // State for the Add/Edit modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Notification shown within the modal (success or error)
  const [notification, setNotification] = useState(null);

  /**
   * Fetches all clients from the server.
   */
  const fetchClients = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("http://localhost:5000/api/clients");
      if (!response.ok) {
        throw new Error(`Error fetching clients: ${response.status}`);
      }
      const { data } = await response.json();
      setClients(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch clients on component mount
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  /**
   * Opens the Add/Edit client modal.
   * @param {object|null} client - if null, create mode; otherwise edit mode.
   */
  const openModal = (client = null) => {
    setSelectedClient(client);
    setIsModalOpen(true);
    setNotification(null);
  };

  /**
   * Closes the modal.
   */
  const closeModal = () => {
    setSelectedClient(null);
    setIsModalOpen(false);
    setNotification(null);
  };

  /**
   * Handles creating or updating a client.
   * @param {object} clientData - new or updated client object
   */
  const handleSubmitClient = async (clientData) => {
    let url = "http://localhost:5000/api/clients";
    let method = "POST";

    // If editing
    if (selectedClient && selectedClient._id) {
      url = `http://localhost:5000/api/clients/${selectedClient._id}`;
      method = "PUT";
    }

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Failed to save client details.");
    }

    // On success, notify user and refresh table
    setNotification({ type: "success", message: "Client saved successfully!" });
    await fetchClients();
  };

  /**
   * useMemo ensures columns aren't recreated on every render.
   */
  const columns = useMemo(
    () => [
      {
        Header: "Client ID",
        accessor: "clientID",
      },
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "Contact Number",
        accessor: "contactNumber",
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const client = row.original;
          return (
            <button
              onClick={() => openModal(client)}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              Edit
            </button>
          );
        },
      },
    ],
    []
  );

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      {/* Header Row: Title + Add Client Button */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Clients</h2>
        <button
          onClick={() => openModal(null)}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Client
        </button>
      </div>

      {/* Optional search filter */}
      <div className="mb-4">
        {/* You can remove this if you want to rely on GlobalDataTable's built-in approach. */}
        {/* Or pass a callback for onGlobalFilterChange to handle searching. */}
      </div>

      {loading && <Notification type="info" message="Loading data..." />}
      {error && <Notification type="error" message={error} />}

      {/* Our reusable global table */}
      <GlobalDataTable
        title="Client Directory"
        columns={columns}
        data={clients}
        loading={loading}
        error={error}
        // If you want an actual search field, pass a callback:
        onGlobalFilterChange={() => {}}
        initialPageSize={5}
      />

      {/* Modal for Add/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={closeModal}
        title={
          selectedClient
            ? `Edit Client: ${selectedClient.name}`
            : "Add New Client"
        }
        description={
          selectedClient
            ? "Update this client's profile. After editing, click 'Save Changes' to confirm."
            : "Create a brand new client profile. Fill in the required fields and click 'Add Client' when done."
        }
        notification={notification}
      >
        <AddClientForm
          existingClient={selectedClient}
          onSubmit={handleSubmitClient}
          onClose={closeModal}
          setNotification={setNotification}
        />
      </Modal>
    </div>
  );
}

export default ClientTable;
