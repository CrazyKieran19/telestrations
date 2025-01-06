const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const currentTurnDisplay = document.getElementById('current-turn');
const drawingBoard = document.getElementById('drawing-board');
const guessInput = document.getElementById('guess-input');
const timerDisplay = document.getElementById('timer');
const overlay = document.getElementById('overlay');
const finalPresentation = document.getElementById('final-presentation');
const wordInputContainer = document.getElementById('word-input-container');
const wordInputField = document.getElementById('word-input-field');
const wordSubmitButton = document.getElementById('word-submit-button');

let isGameStarted = false;
let isHost = false;

// Canvas setup
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

// Join the game
const playerName = prompt("Enter your name:");
socket.emit('joinGame', playerName);

// Update player list
socket.on('updatePlayers', (players) => {
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Handle game start
startButton.addEventListener('click', () => {
  socket.emit('startGame');
});

// Game started
socket.on('gameStarted', ({ timerDuration }) => {
  isGameStarted = true;
  startButton.style.display = 'none';
  wordInputContainer.style.display = 'block';
  startTimer(timerDuration);
});

// Not enough players popup
socket.on('notEnoughPlayers', () => {
  alert('You need at least 3 players to start the game.');
});

// Submit initial word
wordSubmitButton.addEventListener('click', () => {
  const word = wordInputField.value.trim();
  if (word) {
    socket.emit('submit', { playerId: socket.id, content: word });
    wordInputContainer.style.display = 'none';
    drawingBoard.style.display = 'block';
  } else {
    alert('Please enter a word.');
  }
});

// Drawing logic
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

document.getElementById('submit-button').addEventListener('click', () => {
  const drawing = canvas.toDataURL();
  socket.emit('submit', { playerId: socket.id, content: drawing });
  overlay.style.display = 'block';
});

// Timer functionality
function startTimer(duration) {
  let timeLeft = duration;
  timerDisplay.innerText = `Time left: ${timeLeft}s`;

  const timer = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = `Time left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timer);
    }
  }, 1000);
}

// Game over presentation
socket.on('gameOver', (finalData) => {
  finalPresentation.style.display = 'block';
  finalData.forEach((entry) => {
    const div = document.createElement('div');
    div.innerHTML = `
      <h3>${entry.player}</h3>
      ${entry.submissions.map(sub => `<p>${sub}</p>`).join('')}
    `;
    finalPresentation.appendChild(div);
  });
});
