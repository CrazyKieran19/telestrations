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
  isGameStarted: false
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
    } else {
      socket.emit('error', 'You need at least 3 players to start the game.');
    }
  });

  // Handle drawing submission
  socket.on('sendDrawing', (drawing) => {
    if (gameState.currentRound % 2 === 0) {
      // Writing phase
      gameState.rounds.push({ round: gameState.currentRound, word: drawing });
    } else {
      // Drawing phase
      gameState.rounds[gameState.currentRound - 1].drawing = drawing;
    }

    if (gameState.currentRound < gameState.players.length * 2) {
      gameState.currentRound++;
      io.emit('nextRound', gameState);
    } else {
      io.emit('gameEnd', gameState);
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
