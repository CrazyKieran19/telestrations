const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const currentTurnDisplay = document.getElementById('current-turn');
const drawingBoard = document.getElementById('drawing-board');
const guessInput = document.getElementById('guess-input');
const timerDisplay = document.getElementById('timer');

let isHost = false; // Track if the current player is the host

// Join the game
const playerName = prompt("Enter your name:");
socket.emit('joinGame', playerName);

// Receive player role (host or not)
socket.on('playerRole', ({ isHost: host }) => {
  isHost = host;
  startButton.style.display = isHost ? 'block' : 'none'; // Show the start button only for the host
});

// Update player list
socket.on('updatePlayers', (players) => {
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Handle game start
startButton.addEventListener('click', () => {
  if (isHost) socket.emit('startGame');
});

// Display current player's turn
socket.on('currentTurn', (playerName) => {
  currentTurnDisplay.innerText = `It's ${playerName}'s turn.`;
});

// Timer functionality and other game logic omitted for brevity...
