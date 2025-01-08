const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
  rounds: [],
  currentRound: 0,
  isGameStarted: false,
  submitting: new Set(),
  timer: 60, // Timer in seconds
};

app.use(express.static('public'));  // Serve frontend assets

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle player joining
  socket.on('joinGame', (playerName) => {
    const player = { id: socket.id, name: playerName };
    gameState.players.push(player);
    io.emit('playerListUpdate', gameState.players);
    if (gameState.players.length === 1) {
      socket.emit('youAreHost');
    }
  });

  // Handle start game
  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.currentRound = 0;
      io.emit('gameStart', gameState);

      // Start a countdown timer
      const countdown = setInterval(() => {
        gameState.timer--;
        io.emit('updateTimer', gameState.timer);

        if (gameState.timer <= 0 || gameState.submitting.size === gameState.players.length) {
          clearInterval(countdown);
          io.emit('roundTimeout', gameState);
        }
      }, 1000); // Every second
    } else {
      socket.emit('error', 'You need at least 3 players to start the game.');
    }
  });

  // Handle drawing submission
  socket.on('sendDrawing', (input) => {
    gameState.submitting.add(socket.id);
    if (gameState.submitting.size === gameState.players.length) {
      io.emit('allSubmitted', gameState);
    }
  });

  // Handle player disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    io.emit('playerListUpdate', gameState.players);

    // Reset game state if no players left
    if (gameState.players.length === 0) {
      clearInterval(gameState.timer);
      gameState = {
        players: [],
        rounds: [],
        currentRound: 0,
        isGameStarted: false,
        submitting: new Set(),
        timer: 60,
      };
      io.emit('gameReset');
    }
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
