const socket = io();

const playerName = prompt("Enter your name:");
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const drawingBoard = document.getElementById('drawing-board');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const submitButton = document.getElementById('submit-drawing');
let players = [];
let drawings = [];

socket.emit('joinGame', playerName);

socket.on('gameState', (state) => {
  if (state.isGameStarted) {
    startButton.style.display = 'none';
    drawingBoard.style.display = 'block';
  }
});

socket.on('updatePlayers', (newPlayers) => {
  players = newPlayers;
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

socket.on('gameFull', () => {
  alert("Game is full. Try again later.");
});

socket.on('gameStarted', () => {
  startButton.style.display = 'none';
  drawingBoard.style.display = 'block';
});

socket.on('newDrawing', (drawing) => {
  // Logic to display the drawing or update the game with it
});

startButton.addEventListener('click', () => {
  socket.emit('startGame');
});

submitButton.addEventListener('click', () => {
  const drawing = canvas.toDataURL();  // Capture the drawing as an image
  socket.emit('sendDrawing', drawing);
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
