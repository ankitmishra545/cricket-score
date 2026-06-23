require("dotenv").config();

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");

const playerRoutes = require("./routes/playerRoutes");
const matchRoutes = require("./routes/matchRoutes");

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    methods: ["GET", "POST", "PATCH"],
  },
});

connectDB();

app.set("io", io);

app.use(cors());
app.use(express.json());

app.use("/api/players", playerRoutes);
app.use("/api/matches", matchRoutes);

app.get("/", (req, res) => {
  res.json({ message: "API running" });
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("join-match", (matchId) => {
    socket.join(matchId);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
