const express = require('express');
const socketIo = require('socket.io');
const http = require('http');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let gameState = {
  players: [],
  currentRound: 0,
  isGameStarted: false,
  submissions: {}, // Tracks submissions (drawings or guesses) per player per round
  timerDuration: 60, // 1-minute timer
  finalPresentation: [], // Stores game progression for presentation
};

app.use(express.static('public')); // Serve frontend assets

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (playerName) => {
    if (!gameState.isGameStarted) {
      gameState.players.push({ id: socket.id, name: playerName });
      gameState.submissions[socket.id] = []; // Initialize empty submission list
      io.emit('updatePlayers', gameState.players); // Broadcast player list
    } else {
      socket.emit('gameFull');
    }
  });

  socket.on('startGame', () => {
    if (gameState.players.length < 3) {
      io.to(socket.id).emit('notEnoughPlayers');
    } else {
      gameState.isGameStarted = true;
      gameState.currentRound = 1;
      io.emit('gameStarted', { timerDuration: gameState.timerDuration });
      startTimer();
    }
  });

  socket.on('submit', ({ playerId, content }) => {
    gameState.submissions[playerId].push(content); // Save drawing or guess
    checkIfAllSubmitted();
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    delete gameState.submissions[socket.id];
    io.emit('updatePlayers', gameState.players);
  });
});

function startTimer() {
  setTimeout(() => {
    if (gameState.currentRound > gameState.players.length) {
      // Game over
      finalizeGame();
    } else {
      passToNextPlayer();
      io.emit('newRound', {
        round: gameState.currentRound,
        timerDuration: gameState.timerDuration,
      });
      startTimer();
    }
  }, gameState.timerDuration * 1000);
}

function passToNextPlayer() {
  const rotatedSubmissions = {};
  const playerIds = gameState.players.map(player => player.id);

  playerIds.forEach((id, index) => {
    const nextIndex = (index + 1) % playerIds.length;
    rotatedSubmissions[playerIds[nextIndex]] = gameState.submissions[id];
  });

  gameState.submissions = rotatedSubmissions;
  gameState.currentRound++;
}

function checkIfAllSubmitted() {
  const allSubmitted = gameState.players.every(player => 
    gameState.submissions[player.id].length >= gameState.currentRound
  );
  if (allSubmitted) {
    clearTimeout(startTimer);
    startTimer(); // Immediately proceed to the next round
  }
}

function finalizeGame() {
  gameState.finalPresentation = gameState.players.map(player => ({
    player: player.name,
    submissions: gameState.submissions[player.id],
  }));

  io.emit('gameOver', gameState.finalPresentation);
  gameState.isGameStarted = false;
}

server.listen(process.env.PORT || 3000, () => {
  console.log('Server is running');
});
