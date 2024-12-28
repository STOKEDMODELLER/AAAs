import React, { useState, useEffect } from "react";
import Notification from "./Notification";

/**
 * A reusable form for adding or editing a client.
 *
 * Props:
 * - existingClient (optional): Object with client data for editing.
 * - onSubmit: Function to handle form submission (add/edit).
 * - onClose: Function to close the modal.
 * - setNotification: Function to display success/error notifications.
 */
const AddClientForm = ({ existingClient, onSubmit, onClose, setNotification }) => {
  const [formData, setFormData] = useState({
    clientID: "",
    name: "",
    address: "",
    email: "",
    contactNumber: "",
    saID: "",
    passport: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Populate form fields if editing an existing client
  useEffect(() => {
    if (existingClient) {
      setFormData({
        clientID: existingClient.clientID || "",
        name: existingClient.name || "",
        address: existingClient.address || "",
        email: existingClient.email || "",
        contactNumber: existingClient.contactNumber || "",
        saID: existingClient.saID || "",
        passport: existingClient.passport || "",
      });
    }
  }, [existingClient]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic front-end validation examples
    if (!formData.clientID.trim()) {
      setNotification({ type: "error", message: "Client ID is required." });
      return;
    }
    if (!formData.name.trim()) {
      setNotification({ type: "error", message: "Name is required." });
      return;
    }
    if (formData.email && !formData.email.includes("@")) {
      setNotification({ type: "error", message: "Invalid email format." });
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(formData);
      // onSubmit is expected to handle API calls and throw an error if something fails
      onClose();
    } catch (err) {
      setNotification({ type: "error", message: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="clientID" className="block text-gray-600 font-medium">
          Client ID:
        </label>
        <input
          id="clientID"
          name="clientID"
          value={formData.clientID}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="name" className="block text-gray-600 font-medium">
          Name:
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
          required
        />
      </div>

      <div>
        <label htmlFor="address" className="block text-gray-600 font-medium">
          Address:
        </label>
        <input
          id="address"
          name="address"
          value={formData.address}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-gray-600 font-medium">
          Email:
        </label>
        <input
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="contactNumber" className="block text-gray-600 font-medium">
          Contact Number:
        </label>
        <input
          id="contactNumber"
          name="contactNumber"
          value={formData.contactNumber}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="saID" className="block text-gray-600 font-medium">
          SA ID:
        </label>
        <input
          id="saID"
          name="saID"
          value={formData.saID}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label htmlFor="passport" className="block text-gray-600 font-medium">
          Passport:
        </label>
        <input
          id="passport"
          name="passport"
          value={formData.passport}
          onChange={handleChange}
          className="w-full p-2 rounded-md bg-gray-100 border border-gray-300 focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className={`w-full p-2 rounded-md text-white font-semibold transition-all ${
          isSubmitting
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-blue-500 hover:bg-blue-600"
        }`}
      >
        {isSubmitting
          ? "Saving..."
          : existingClient
          ? "Save Changes"
          : "Add Client"}
      </button>
    </form>
  );
};

export default AddClientForm;
