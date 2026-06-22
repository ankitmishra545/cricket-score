import { io } from "socket.io-client";

export const socket = io("https://cricket-score-8018.onrender.com", {
  autoConnect: false,
});
