import React from "react";
import { useClients } from "../context/ClientsContext";

const ClientDropdown = () => {
  const { clients, loading, error } = useClients();

  if (loading) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-md mx-auto">
        <p className="text-gray-400">Loading clients...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-md mx-auto">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  if (clients.length === 0) {
    return (
      <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-md mx-auto">
        <p className="text-gray-400">No clients to display.</p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-white w-full max-w-md mx-auto">
      <label
        htmlFor="clientDropdown"
        className="block text-gray-400 font-medium mb-2"
      >
        Select a Client:
      </label>
      <select
        id="clientDropdown"
        className="w-full p-2 bg-gray-700 text-white rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
        defaultValue=""
      >
        <option value="" disabled>
          -- Select Client --
        </option>
        {clients.map((client) => (
          <option key={client._id} value={client.name}>
            {client.name}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ClientDropdown;
