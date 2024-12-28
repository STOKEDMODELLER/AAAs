import React, { useState } from "react";
import Modal from "./Modal";
import AddClientForm from "./AddClientForm";
import GlobalDataTable from "./GlobalDataTable";

/**
 * Uses a global data table to present the client's fields in a tabular format,
 * with an "Edit Client" button that opens a modal for updating.
 *
 * Props:
 * - client: the client object with fields like clientID, name, email, etc.
 * - refreshClients: function to refetch client data
 */
function ClientCard({ client, refreshClients }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleEditSubmit = async (updatedClient) => {
    const url = `http://13.246.7.5:5000/api/clients/${client._id}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedClient),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Error editing client.");
    }
    await refreshClients();
  };

  // Convert client object into data table rows
  const columns = [
    { Header: "Field", accessor: "fieldName" },
    { Header: "Value", accessor: "value" },
  ];

  const clientData = [
    { fieldName: "Client ID", value: client.clientID },
    { fieldName: "Name", value: client.name },
    { fieldName: "Email", value: client.email },
    { fieldName: "Contact Number", value: client.contactNumber },
    { fieldName: "SA ID", value: client.saID },
    { fieldName: "Passport", value: client.passport },
    { fieldName: "Address", value: client.address },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-4 hover:shadow-xl transition-shadow duration-300">
      <h3 className="text-lg font-bold text-gray-800 mb-2">
        Client Overview
      </h3>

      <GlobalDataTable
        title={`${client.name || "Unknown Client"}'s Details`}
        columns={columns}
        data={clientData}
        loading={false}
        error={null}
        // No search needed for a small data set
        onGlobalFilterChange={null}
        // Show all rows at once
        initialPageSize={clientData.length}
      />

      <button
        onClick={() => setIsModalOpen(true)}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition duration-200"
      >
        Edit Client
      </button>

      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          title={`Edit Client: ${client.name}`}
          description="Update this client's information, like name or email. Click 'Save Changes' when finished."
        >
          <AddClientForm
            existingClient={client}
            onSubmit={handleEditSubmit}
            onClose={handleCloseModal}
            setNotification={() => {}}
          />
        </Modal>
      )}
    </div>
  );
}

export default ClientCard;
