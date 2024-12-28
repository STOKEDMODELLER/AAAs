// src/utils/formatNumber.js

/**
 * Format number with thousand separators and fixed decimals
 * @param {number|string} value - The number to format.
 * @param {number} [decimalPlaces=2] - Number of decimal places.
 * @returns {string} - Formatted number with commas and fixed decimals.
 */
export const formatNumber = (value, decimalPlaces = 2) => {
    if (value === "" || value === null || value === undefined) return "";
    const number = parseFloat(value);
    if (isNaN(number)) return value; // Return original value if not a number
    return new Intl.NumberFormat("en-US", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
    }).format(number);
  };
  