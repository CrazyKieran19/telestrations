const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
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
      io.emit('gameStart');
    } else {
      socket.emit('error', 'You need at least 3 players to start the game.');
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
