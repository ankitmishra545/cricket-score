import axios from "axios";

const API_URL = "http://localhost:5000/api/players";

export const getPlayers = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

export const createPlayer = async (name) => {
  const response = await axios.post(API_URL, { name });
  return response.data;
};
