const dotenv = require("dotenv");
const { createServer } = require("node:http");
const { Server } = require("socket.io");
const express = require("express");
const app = express();

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});

//* INI AKAN DI SIMPAN DALAM ARRAY
const messages = [];

// 2 Instance WebSocket -> Socket.IO Server
io.on("connection", (socket) => {
  console.log("a user connected", socket.id);
});

server.listen(3000, () => {
  console.log(`Server is running on port: http://localhost:3000`);
});
