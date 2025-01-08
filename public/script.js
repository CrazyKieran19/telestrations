const socket = io();

const playerName = prompt("Enter your name:");
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const drawingBoard = document.getElementById('drawing-board');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const submitButton = document.getElementById('submit-drawing');
const timerDisplay = document.getElementById('timer-display');
const currentRoundDisplay = document.getElementById('current-round');
let players = [];
let isHost = false;

// Emit join game with player name
socket.emit('joinGame', playerName);

// Update player list and manage start button visibility
socket.on('playerListUpdate', (newPlayers) => {
  players = newPlayers;
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');

  // Enable Start Game button when 3 or more players join
  if (players.length >= 3 && isHost) {
    startButton.classList.add('enabled');
    startButton.classList.remove('disabled');
    startButton.disabled = false;
  } else if (isHost) {
    startButton.classList.add('disabled');
    startButton.classList.remove('enabled');
    startButton.disabled = true;
  }
});

// Only show the start button to the host
socket.on('youAreHost', () => {
  isHost = true;
  startButton.style.display = 'block';
});

// Start game logic
socket.on('gameStart', (state) => {
  drawingBoard.style.display = 'block';
  startButton.style.display = 'none';
  currentRoundDisplay.textContent = state.currentRound;
  timerDisplay.textContent = state.timer;
});

// Timer update
socket.on('updateTimer', (timer) => {
  timerDisplay.textContent = timer;
});

// Handle round timeout
socket.on('roundTimeout', () => {
  drawingBoard.style.display = 'none';
});

// Start button click event
startButton.addEventListener('click', () => {
  if (players.length >= 3) {
    socket.emit('startGame');
  } else {
    alert('You need at least 3 players to start the game.');
  }
});

// Drawing functionality
canvas.addEventListener('mousedown', (e) => {
  const { offsetX, offsetY } = e;
  ctx.beginPath();
  ctx.moveTo(offsetX, offsetY);

  canvas.addEventListener('mousemove', draw);
});

canvas.addEventListener('mouseup', () => {
  canvas.removeEventListener('mousemove', draw);
});

function draw(e) {
  const { offsetX, offsetY } = e;
  ctx.lineTo(offsetX, offsetY);
  ctx.stroke();
}
