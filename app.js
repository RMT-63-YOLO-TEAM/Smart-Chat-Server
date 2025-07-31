const dotenv = require("dotenv");
dotenv.config();
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

const messages = [];

io.on("connection", (socket) => {
  console.log("a user connected", socket.id);

  socket.emit("welcome", { socketId: socket.id });

  // 👥 Join Room
  socket.on("join", ({ username, room }) => {
    if (!username || username.length < 2) {
      socket.emit("error", {
        type: "error",
        message: "Username must be at least 2 characters",
      });
      return;
    }
    if (!room || room.length < 3) {
      socket.emit("error", {
        type: "error",
        message: "Room name must be at least 3 characters",
      });
      return;
    }

    socket.join(room);
    socket.data.username = username;
    socket.data.room = room;
    socket.emit("joined", { room, username });
    socket.to(room).emit("user-joined", { username });
    console.log(`${username} joined room ${room}`);
  });

  // 💬 Handle Chat Message TURU
  socket.on("chat message", (msg) => {
    const room = socket.data.room;
    const username = socket.data.username || socket.id;

    const newMessage = room
      ? { room, user: username, message: msg }
      : { id: socket.id, message: msg };

    messages.push(newMessage);

    if (room) {
      io.to(room).emit("chat message", newMessage);
    } else {
      io.emit("chat message", newMessage);
    }
  });

  // 🤖 Ask AI
  socket.on("/ask/ai", async ({ prompt }) => {
    const { generateAi } = require("./helpers/gemini");

    io.emit("/ai/loading", true);
    try {
      const promptAi = `
You are ChatAssist, a smart and professional AI assistant in a global chat application.
When a user invokes the /askai command, follow these guidelines:
1. Respond in clear, fluent English (or switch to the user’s language if explicitly requested).
2. Start with a concise 1–2 sentence summary of your answer.
3. Use bullet points or numbered steps for detailed explanations when helpful.
4. Include concrete examples or analogies to illustrate your points.
5. Maintain a friendly, courteous tone throughout.
6. Do not ask any follow‑up questions—just provide the complete answer based on the user’s input.

User: "${prompt}" `;

      const aiResponse = await generateAi(promptAi);
      const aiMessage = {
        user: "AI",
        message: aiResponse,
      };

      messages.push(aiMessage);

      io.emit("/ai/loading", false);
      const room = socket.data.room;
      if (room) {
        io.to(room).emit("chat message", aiMessage);
      } else {
        io.emit("chat message", aiMessage);
      }
    } catch (error) {
      console.error("Error generating AI response:", error);
      const errorMessage = {
        user: "AI",
        message: "Error generating AI response. Please try again.",
      };
      messages.push(errorMessage);
      io.emit("/ai/loading", false);
      io.emit("chat message", errorMessage);
    }
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    const username = socket.data.username;
    const room = socket.data.room;
    if (room && username) {
      socket.to(room).emit("user-left", { username });
    }
  });
});

server.listen(3000, () => {
  console.log(`✅ Server is running on port: http://localhost:3000`);
});
