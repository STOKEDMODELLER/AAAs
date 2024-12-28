import React, { useState } from "react";
import ClientCard from "./ClientCard";
import Modal from "./Modal";
import AddClientForm from "./AddClientForm";

/**
 * Shows a list of ClientCards, and also includes a button to Add a new Client.
 * The actual table-based approach is handled by ClientTable.js,
 * but this "card layout" approach is sometimes useful as well.
 *
 * Props:
 * - clients: Array of client objects
 * - refreshClients: A function to refetch or refresh the client list
 */
const ClientList = ({ clients, refreshClients }) => {
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  const openAddClientModal = () => {
    setShowAddClientModal(true);
  };

  const closeAddClientModal = () => {
    setShowAddClientModal(false);
  };

  const handleAddClientSubmit = async (newClient) => {
    const response = await fetch("http://localhost:5000/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClient),
    });

    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.message || "Error adding new client.");
    }

    await refreshClients();
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-semibold text-gray-700">Clients</h2>
        <button
          onClick={openAddClientModal}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
        >
          Add Client
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clients && clients.length > 0 ? (
          clients.map((client) => (
            <ClientCard
              key={client._id || client.clientID}
              client={client}
              refreshClients={refreshClients}
            />
          ))
        ) : (
          <p className="text-gray-500 italic col-span-full">
            No clients found. Add new clients to build your network and keep track of valuable connections.
          </p>
        )}
      </div>

      {showAddClientModal && (
        <Modal
          isOpen={showAddClientModal}
          onClose={closeAddClientModal}
          title="Add New Client"
        >
          <AddClientForm
            onSubmit={handleAddClientSubmit}
            onClose={closeAddClientModal}
            setNotification={() => {}}
          />
        </Modal>
      )}
    </div>
  );
};

export default ClientList;
