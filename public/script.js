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
let currentRound = 0;

socket.emit('joinGame', playerName);

socket.on('playerListUpdate', (newPlayers) => {
  players = newPlayers;
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

socket.on('youAreHost', () => {
  startButton.style.display = 'block';
});

socket.on('gameStart', (state) => {
  drawingBoard.style.display = 'block';
  startButton.style.display = 'none';
  currentRound = state.currentRound;
  currentRoundDisplay.textContent = currentRound;
  timerDisplay.textContent = state.timer;
});

socket.on('updateTimer', (timer) => {
  timerDisplay.textContent = timer;
});

socket.on('roundTimeout', (state) => {
  drawingBoard.style.display = 'none';
  if (state.submitting.size === state.players.length) {
    submitButton.textContent = 'Submitted';
    submitButton.disabled = true;
  }
});

submitButton.addEventListener('click', () => {
  socket.emit('sendDrawing');
});

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
