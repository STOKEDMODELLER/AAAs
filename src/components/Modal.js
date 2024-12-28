import React from "react";

/**
 * A reusable Modal component with optional description and notification section.
 *
 * Props:
 * - isOpen: Boolean controlling modal visibility
 * - onClose: Function to close the modal
 * - title: Modal title
 * - description: A short explanation of what this modal does
 * - notification: { type: "success" | "error", message: string } or null
 * - children: The modal body content (form, etc.)
 */
function Modal({ isOpen, onClose, title, description, notification, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <header className="px-4 py-2 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
        </header>
        <main className="p-4">
          {description && (
            <p className="mb-3 text-sm text-gray-600">{description}</p>
          )}
          {notification && (
            <div
              className={`p-2 rounded mb-4 ${
                notification.type === "success"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              {notification.message}
            </div>
          )}
          {children}
        </main>
        <footer className="px-4 py-2 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition duration-200"
          >
            Close
          </button>
        </footer>
      </div>
    </div>
  );
}

export default Modal;
