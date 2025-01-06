const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
  drawings: [],
  currentRound: 0,
  isGameStarted: false,
};

app.use(express.static('public')); // Serve frontend assets

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (playerName) => {
    if (gameState.players.length < 8 && !gameState.isGameStarted) {
      gameState.players.push({ id: socket.id, name: playerName });
      socket.emit('gameState', gameState); // Send current game state to the new player
      io.emit('updatePlayers', gameState.players); // Broadcast player list
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.currentRound = 1;
      io.emit('gameStarted', gameState); // Notify all players that the game has started
    } else {
      socket.emit('notEnoughPlayers', "At least 3 players are required to start the game.");
    }
  });

  socket.on('sendDrawing', (drawing) => {
    gameState.drawings.push(drawing);
    io.emit('newDrawing', drawing);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    io.emit('updatePlayers', gameState.players);
  });
});

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
