import React from "react";

/**
 * A reusable notification component.
 * Props:
 * - type: "success" | "error" | "info"
 * - message: The notification text
 */
const Notification = ({ type, message }) => {
  const baseStyle =
    "px-4 py-2 rounded-md text-sm font-semibold mb-4 text-center";
  const typeStyles = {
    success: "bg-green-100 text-green-800",
    error: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
  };

  return (
    <div className={`${baseStyle} ${typeStyles[type] || ""}`}>
      {message}
    </div>
  );
};

export default Notification;
