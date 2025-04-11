const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static("public"));

let players = [];
let chain = [];
let currentTurn = 0;

io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);
  players.push(socket.id);

  socket.emit("playerId", socket.id);

  if (players.length === 1) {
    socket.emit("role", "draw");
  } else {
    socket.emit("role", "guess");
  }

  socket.on("submitDrawing", (dataUrl) => {
    chain.push({ type: "drawing", content: dataUrl });
    currentTurn++;
    io.emit("nextTurn", { role: "guess", data: dataUrl });
  });

  socket.on("submitGuess", (text) => {
    chain.push({ type: "guess", content: text });
    currentTurn++;
    io.emit("nextTurn", { role: "draw", data: text });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
    players = players.filter((id) => id !== socket.id);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
