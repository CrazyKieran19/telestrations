const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

let gameState = {
  players: [],
  isGameStarted: false,
  currentRound: 0,
  maxRounds: 0,
  timerDuration: 60,
  submissions: {},
};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Handle player joining
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

  // Start the game
  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.currentRound = 1;
      gameState.maxRounds = gameState.players.length * 2; // Scale rounds with player count
      resetSubmissions();
      startRound();
      io.emit('gameStarted');
    } else {
      socket.emit('notEnoughPlayers');
    }
  });

  // Handle submissions
  socket.on('submit', (data) => {
    gameState.submissions[socket.id] = data;

    // Check if all players have submitted
    if (Object.keys(gameState.submissions).length === gameState.players.length) {
      advanceRound();
    }
  });

  // Handle disconnection
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

function resetSubmissions() {
  gameState.submissions = {};
}

function startRound() {
  io.emit('startRound', {
    round: gameState.currentRound,
    maxRounds: gameState.maxRounds,
    timerDuration: gameState.timerDuration,
  });

  // Start a timer for the round
  setTimeout(() => {
    if (Object.keys(gameState.submissions).length < gameState.players.length) {
      console.log('Timer ran out, advancing round...');
      advanceRound();
    }
  }, gameState.timerDuration * 1000);
}

function advanceRound() {
  resetSubmissions();

  if (gameState.currentRound < gameState.maxRounds) {
    gameState.currentRound++;
    startRound();
  } else {
    endGame();
  }
}

function endGame() {
  io.emit('endGame', gameState);
  gameState.isGameStarted = false;
}

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
