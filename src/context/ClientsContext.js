import React, { createContext, useState, useContext, useEffect } from "react";
import { getClients, addClient } from "../api/clientsApi";

const ClientsContext = createContext();

export const ClientsProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const data = await getClients();
        setClients(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const addNewClient = async (name) => {
    try {
      const newClient = await addClient(name);
      setClients((prev) => [...prev, newClient]);
    } catch (err) {
      throw new Error(err.message);
    }
  };

  return (
    <ClientsContext.Provider value={{ clients, addNewClient, loading, error }}>
      {children}
    </ClientsContext.Provider>
  );
};

export const useClients = () => {
  const context = useContext(ClientsContext);
  if (!context) {
    throw new Error("useClients must be used within ClientsProvider");
  }
  return context;
};
