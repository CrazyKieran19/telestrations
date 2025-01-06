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

// Game state
let isGameStarted = false;
let isHost = false;
let timerInterval = null;
let playerName = '';

// Prompt for name as soon as the page loads
window.onload = () => {
  // Ensure the prompt is the first thing the user sees
  playerName = prompt("Enter your name:");
  
  if (playerName) {
    socket.emit('joinGame', playerName); // Emit join event once the name is provided
  } else {
    alert("You need to enter a name to play!");
  }
};

// Update player list
socket.on('updatePlayers', (players) => {
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Handle game start
socket.on('gameStarted', ({ timerDuration }) => {
  isGameStarted = true;
  startButton.style.display = 'none'; // Hide start button after game starts
  wordInputContainer.style.display = 'block'; // Show word input
  timerDisplay.style.display = 'block'; // Show the timer
  startTimer(timerDuration); // Start the timer
});

// Handle "not enough players" scenario
socket.on('notEnoughPlayers', () => {
  alert('You need at least 3 players to start the game.');
});

// Start button click event (only shows for the host)
socket.on('gameHost', () => {
  isHost = true;
  startButton.style.display = 'block'; // Show start button only for the host
});

// Submit word and proceed to drawing phase
wordSubmitButton.addEventListener('click', () => {
  const word = wordInputField.value.trim();
  if (word) {
    socket.emit('submitWord', { playerId: socket.id, word: word });
    wordInputContainer.style.display = 'none';
    drawingBoard.style.display = 'block';
  } else {
    alert('Please enter a word.');
  }
});

// Drawing logic
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
let isDrawing = false;

// Mouse events for drawing
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

// Submit the drawing
document.getElementById('submit-button').addEventListener('click', () => {
  const drawing = canvas.toDataURL(); // Capture the drawing as an image
  socket.emit('submitDrawing', { playerId: socket.id, drawing: drawing });
  overlay.style.display = 'block'; // Show the "submitted" overlay
});

// Timer logic
function startTimer(duration) {
  let timeLeft = duration;
  timerDisplay.innerText = `Time left: ${timeLeft}s`;

  // Start the countdown timer
  timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = `Time left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      // Call to handle the end of the round (or switch to next round)
      passToNextRound();
    }
  }, 1000);
}

// Handle game round transition
function passToNextRound() {
  // Handle switching to next player/round logic
  socket.emit('nextRound');
}

// Final Presentation (Display after game ends)
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
}
