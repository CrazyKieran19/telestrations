const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const drawingBoard = document.getElementById('drawing-board');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const submitButton = document.getElementById('submit-drawing');

// Player name prompt
const playerName = prompt("Enter your name:");
socket.emit('joinGame', playerName);

// Variables to store state
let players = [];
let isHost = false;

// Update the game state when received
socket.on('gameState', (state) => {
  if (!state.isGameStarted) {
    if (state.players[0].id === socket.id) {
      isHost = true;
      startButton.style.display = 'block'; // Show Start Game button for the host
    }
  }
});

// Update player list in real time
socket.on('updatePlayers', (newPlayers) => {
  players = newPlayers;
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Notify if the game is full
socket.on('gameFull', () => {
  alert("Game is full. Try again later.");
});

// Handle the start of the game
socket.on('gameStarted', () => {
  startButton.style.display = 'none'; // Hide Start Game button
  drawingBoard.style.display = 'block'; // Show drawing board
});

// Notify if there aren’t enough players
socket.on('notEnoughPlayers', (message) => {
  alert(message);
});

// Start Game button click handler
startButton.addEventListener('click', () => {
  socket.emit('startGame');
});

// Submit drawing button click handler
submitButton.addEventListener('click', () => {
  const drawing = canvas.toDataURL(); // Capture the canvas drawing as an image
  socket.emit('sendDrawing', drawing);
});

// Drawing on the canvas
let isDrawing = false;

canvas.addEventListener('mousedown', (e) => {
  isDrawing = true;
  ctx.beginPath();
  ctx.moveTo(e.offsetX, e.offsetY);
});

canvas.addEventListener('mousemove', (e) => {
  if (isDrawing) {
    ctx.lineTo(e.offsetX, e.offsetY);
    ctx.stroke();
  }
});

canvas.addEventListener('mouseup', () => {
  isDrawing = false;
});

// Clear canvas after drawing
submitButton.addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
});
