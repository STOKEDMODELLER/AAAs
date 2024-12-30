// src/utils/formatNumber.js

// src/utils/formatCurrency.js

import CurrencyCodes from "currency-codes";
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
  

/**
 * Formats a number based on the provided currency code.
 * @param {number} amount - The amount to format.
 * @param {string} currencyCode - The ISO 4217 currency code.
 * @returns {string} - The formatted currency string.
 */
export const formatCurrency = (amount, currencyCode = "USD") => {
  if (isNaN(amount)) {
    return "0.00";
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch (error) {
    console.error(`Invalid currency code "${currencyCode}":`, error);
    // Fallback to USD if currency code is invalid
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  }
};
