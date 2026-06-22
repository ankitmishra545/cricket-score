import axios from "axios";

const API_URL = "https://cricket-score-8018.onrender.com/api/matches";

export const createMatch = async (payload) => {
  const response = await axios.post(API_URL, payload);

  return response.data;
};

export const getMatch = async (id) => {
  const response = await axios.get(`${API_URL}/${id}`);

  return response.data;
};

export const startMatch = async (id, payload) => {
  const response = await axios.patch(`${API_URL}/${id}/start`, payload);

  return response.data;
};

export const addRuns = async (id, runs) => {
  const response = await axios.patch(`${API_URL}/${id}/runs`, { runs });

  return response.data;
};

export const undoBall = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/undo`);

  return response.data;
};

export const addExtra = async (id, type, runs, completedRuns = 0) => {
  const response = await axios.patch(`${API_URL}/${id}/extra`, {
    type,
    runs,
    completedRuns,
  });

  return response.data;
};

export const changeBowler = async (id, bowlerId) => {
  const response = await axios.patch(`${API_URL}/${id}/bowler`, { bowlerId });

  return response.data;
};

export const addWicket = async (id, nextBatter) => {
  const response = await axios.patch(`${API_URL}/${id}/wicket`, {
    nextBatter,
  });

  return response.data;
};

export const addRunOut = async (id, runs, outPlayer, nextBatter) => {
  const response = await axios.patch(`${API_URL}/${id}/runout`, {
    runs,
    outPlayer,
    nextBatter,
  });

  return response.data;
};

export const allOut = async (id) => {
  const response = await axios.patch(`${API_URL}/${id}/allout`);

  return response.data;
};

export const getScorecard = async (id) => {
  const response = await axios.get(`${API_URL}/${id}/scorecard`);

  return response.data;
};

export const getMatches = async () => {
  const response = await axios.get(API_URL);

  return response.data;
};
