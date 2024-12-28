import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api";

export const getClients = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/clients`);
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || "Error fetching clients");
  }
};

export const addClient = async (clientName: string) => {
  try {
    const response = await axios.post(`${API_BASE_URL}/clients`, { name: clientName });
    return response.data;
  } catch (error) {
    throw new Error(error.response?.data || "Error adding client");
  }
};
