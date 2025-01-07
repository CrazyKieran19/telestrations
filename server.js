const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Game state
let gameState = {
  players: [],
  isGameStarted: false,
};

// Serve static files
app.use(express.static('public'));

// Routes
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('joinGame', (name) => {
    if (!gameState.isGameStarted) {
      gameState.players.push({ id: socket.id, name });
      io.emit('updatePlayers', gameState.players);

      // If host, emit gameHost
      if (gameState.players.length === 1) {
        socket.emit('gameHost');
      }

      // Notify host if there are at least 3 players
      if (gameState.players.length >= 3) {
        const hostSocket = gameState.players[0].id;
        io.to(hostSocket).emit('enableStartButton');
      }
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      io.emit('gameStarted', { timerDuration: 60 });
    } else {
      socket.emit('notEnoughPlayers');
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter((player) => player.id !== socket.id);
    io.emit('updatePlayers', gameState.players);

    if (gameState.players.length < 3 && !gameState.isGameStarted) {
      const hostSocket = gameState.players[0]?.id;
      if (hostSocket) {
        io.to(hostSocket).emit('disableStartButton');
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
