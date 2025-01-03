// src/App.js

import React, { useState, useEffect } from "react";
import "./App.css"; // Import Tailwind CSS

import ClientTable from "./components/ClientTable";
import LoanList from "./components/LoanList";
import PaymentList from "./components/PaymentList";
import Notification from "./components/Notification";
import Report from "./components/Report"; // Import the new Report component

const App = () => {
  const [clients, setClients] = useState([]);
  const [loans, setLoans] = useState([]);
  const [payments, setPayments] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [notification, setNotification] = useState(null);
  const [paymentRefreshCount, setPaymentRefreshCount] = useState(0); // **Refresh Trigger Counter**

  /**
   * Function to trigger payments refresh
   */
  const triggerPaymentRefresh = () => {
    setPaymentRefreshCount((prev) => prev + 1);
  };

  /**
   * Fetch data utility function
   */
  const fetchData = async (endpoint, setData, resourceName) => {
    try {
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
      const { data } = await response.json();
      setData(data);
    } catch (err) {
      console.error(`Error fetching ${resourceName}:`, err.message);
      setError(`Failed to fetch ${resourceName}`);
    }
  };

  /**
   * Fetch Payments
   */
  const fetchPaymentsData = async () => {
    try {
      const response = await fetch("http://13.246.7.5:5000/api/payments");
      if (!response.ok) {
        throw new Error("Failed to fetch payments.");
      }
      const result = await response.json();
      setPayments(result.data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
      setNotification({ type: "error", message: error.message });
    }
  };

  /**
   * Fetch Loans
   */
  const fetchLoansData = async () => {
    await fetchData("http://13.246.7.5:5000/api/loans", setLoans, "loans");
  };

  /**
   * Fetch Clients
   */
  const fetchClientsData = async () => {
    await fetchData("http://13.246.7.5:5000/api/clients", setClients, "clients");
  };

  /**
   * Initialize data on component mount and when paymentRefreshCount changes
   */
  useEffect(() => {
    setLoading(true);

    Promise.all([
      fetchClientsData(),
      fetchLoansData(),
      fetchPaymentsData(),
    ]).finally(() => setLoading(false));
  }, [paymentRefreshCount]); // **Re-fetch when paymentRefreshCount changes**

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Notification type="info" message="Loading... Hang tight while we fetch your data!" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <Notification type="error" message={error} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-10xl mx-auto bg-white rounded-lg shadow-lg p-6">
        <header className="mb-6 text-center">
          <h1 className="text-4xl font-bold text-gray-800">Welcome to Your Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Your comprehensive view for managing clients, loans, and payments. Discover actionable
            insights and seamless management in every section.
          </p>
        </header>

        {/* Split Page Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Left Column */}
          <div className="bg-gray-50 p-4 rounded-lg flex flex-col space-y-6">
            <section>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Clients</h2>
              <ClientTable
                clients={clients}
                onSelectClient={(client) => {
                  setSelectedClient(client);
                  setSelectedLoan(null);
                }}
              />
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Loans</h2>
              <LoanList
                loans={loans}
                fetchLoans={fetchLoansData}
                triggerPaymentRefresh={triggerPaymentRefresh} // **Pass the refresh trigger function**
              />
            </section>

            <section>
              <h2 className="text-2xl font-semibold text-gray-700 mb-4">Payments</h2>
              <PaymentList
                clients={clients} // **Pass client data for mapping**
                refreshTrigger={paymentRefreshCount} // **Pass the refresh trigger counter**
              />
            </section>
          </div>

          {/* Right Column: Report */}
          <Report
            selectedClient={selectedClient}
            selectedLoan={selectedLoan}
            payments={payments}
            clients={clients}
            loans={loans}
            setSelectedClient={setSelectedClient}
            setSelectedLoan={setSelectedLoan}
          />
        </div>
      </div>

      {/* Notification */}
      {notification && <Notification type={notification.type} message={notification.message} />}
    </div>
  );
};

export default App;
