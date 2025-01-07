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
  round: 0,
  maxRounds: 3,
  submissions: [],
  timer: null,
};

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Player joins the game
  socket.on('joinGame', (name) => {
    if (!gameState.isGameStarted) {
      gameState.players.push({ id: socket.id, name, hasSubmitted: false });
      io.emit('updatePlayers', gameState.players);

      if (gameState.players.length === 1) {
        socket.emit('gameHost');
      }

      if (gameState.players.length >= 3) {
        const hostSocket = gameState.players[0].id;
        io.to(hostSocket).emit('enableStartButton');
      }
    } else {
      socket.emit('gameFull');
    }
  });

  // Host starts the game
  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.round = 1;
      io.emit('gameStarted', { round: gameState.round, timerDuration: 60 });
      startTimer();
    } else {
      socket.emit('notEnoughPlayers');
    }
  });

  // Player submits their drawing or guess
  socket.on('submit', (submission) => {
    const player = gameState.players.find((p) => p.id === socket.id);
    if (player) {
      player.hasSubmitted = true;
      gameState.submissions.push(submission);

      // Check if all players have submitted
      if (gameState.players.every((p) => p.hasSubmitted)) {
        advanceRound();
      }
    }
  });

  // Player disconnects
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

  // Advance the game to the next round
  function advanceRound() {
    clearTimeout(gameState.timer);
    gameState.round++;

    // Reset submission state
    gameState.players.forEach((p) => (p.hasSubmitted = false));
    gameState.submissions = [];

    if (gameState.round > gameState.maxRounds) {
      io.emit('gameOver', { submissions: gameState.submissions });
      resetGame();
    } else {
      io.emit('newRound', { round: gameState.round, timerDuration: 60 });
      startTimer();
    }
  }

  // Timer function
  function startTimer() {
    gameState.timer = setTimeout(() => {
      advanceRound();
    }, 60000);
  }

  // Reset the game
  function resetGame() {
    gameState = {
      players: [],
      isGameStarted: false,
      round: 0,
      maxRounds: 3,
      submissions: [],
      timer: null,
    };
    io.emit('reset');
  }
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
