const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
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
      gameState.players.push({ id: socket.id, name: playerName });
      io.emit('updatePlayers', gameState.players);
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('startGame', () => {
    if (gameState.players.length >= 3) {
      gameState.isGameStarted = true;
      gameState.turnQueue = [...gameState.players]; // Create the turn order
      startTurn();
    } else {
      socket.emit('notEnoughPlayers', "At least 3 players are required to start the game.");
    }
  });

  socket.on('submitDrawing', (drawing) => {
    if (gameState.currentTask === 'draw' && socket.id === gameState.turnQueue[gameState.currentTurn].id) {
      gameState.currentPrompt = drawing; // Store the drawing
      nextTurn(); // Move to the next player
    }
  });

  socket.on('submitGuess', (guess) => {
    if (gameState.currentTask === 'guess' && socket.id === gameState.turnQueue[gameState.currentTurn].id) {
      gameState.currentPrompt = guess; // Store the guess
      nextTurn(); // Move to the next player
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    gameState.turnQueue = gameState.turnQueue.filter(player => player.id !== socket.id);
    io.emit('updatePlayers', gameState.players);
  });
});

// Move to the next turn
function nextTurn() {
  gameState.currentTurn++;
  if (gameState.currentTurn >= gameState.turnQueue.length) {
    endGame(); // If all players have had a turn, end the game
  } else {
    gameState.currentTask = gameState.currentTask === 'draw' ? 'guess' : 'draw'; // Alternate tasks
    startTurn();
  }
}

// Start the current player's turn
function startTurn() {
  const currentPlayer = gameState.turnQueue[gameState.currentTurn];
  io.to(currentPlayer.id).emit('yourTurn', {
    task: gameState.currentTask,
    prompt: gameState.currentPrompt,
    timer: gameState.timerDuration,
  });

  // Notify others about the current player's turn
  io.emit('currentTurn', currentPlayer.name);

  // Start timer
  setTimeout(() => {
    nextTurn(); // Automatically move to the next turn after the timer expires
  }, gameState.timerDuration * 1000);
}

// End the game
function endGame() {
  gameState.isGameStarted = false;
  io.emit('gameOver', "Game Over! Thanks for playing.");
}

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
