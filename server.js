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
  submitting: new Set(), // Set to track players who have submitted
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

    // Broadcast the updated player list
    io.emit('playerListUpdate', gameState.players);

    // Assign host to the first player who joins
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

      // Set a timer for 60 seconds
      setTimeout(() => {
        if (gameState.submitting.size !== gameState.players.length) {
          io.emit('roundTimeout', gameState);
        }
      }, 60000); // 60 seconds
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
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
