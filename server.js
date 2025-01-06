const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
  hostId: null, // The socket ID of the host
  turnQueue: [],
  currentTurn: 0,
  isGameStarted: false,
  timerDuration: 60, // 1-minute timer
  currentTask: 'draw', // Task can be 'draw' or 'guess'
  currentPrompt: '', // Store the current guess or drawing
};

app.use(express.static('public')); // Serve frontend assets

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (playerName) => {
    if (gameState.players.length < 8 && !gameState.isGameStarted) {
      const isHost = gameState.players.length === 0; // First player becomes the host
      gameState.players.push({ id: socket.id, name: playerName });
      if (isHost) gameState.hostId = socket.id; // Set the host ID

      socket.emit('playerRole', { isHost }); // Inform the player of their role
      io.emit('updatePlayers', gameState.players); // Update the player list for everyone
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('startGame', () => {
    if (socket.id === gameState.hostId && gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.turnQueue = [...gameState.players]; // Create the turn order
      startTurn();
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove player from the game state
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    gameState.turnQueue = gameState.turnQueue.filter(player => player.id !== socket.id);

    // If the host disconnects, assign a new host
    if (socket.id === gameState.hostId && gameState.players.length > 0) {
      gameState.hostId = gameState.players[0].id;
      io.to(gameState.hostId).emit('playerRole', { isHost: true });
    }

    io.emit('updatePlayers', gameState.players);
  });

  // Other game logic omitted for brevity...
});

// Function to start the turn of the current player
function startTurn() {
  const currentPlayer = gameState.turnQueue[gameState.currentTurn];
  io.to(currentPlayer.id).emit('yourTurn', {
    task: gameState.currentTask,
    prompt: gameState.currentPrompt,
    timer: gameState.timerDuration,
  });

  // Notify all players about the current turn
  io.emit('currentTurn', currentPlayer.name);
}

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
