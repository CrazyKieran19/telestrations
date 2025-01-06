const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const currentTurnDisplay = document.getElementById('current-turn');
const drawingBoard = document.getElementById('drawing-board');
const guessInput = document.getElementById('guess-input');
const timerDisplay = document.getElementById('timer');

let isGameStarted = false;

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
  drawingBoard.style.display = 'block';
  startTimer(timerDuration);
});

// New round
socket.on('newRound', ({ round, timerDuration }) => {
  if (round % 2 === 1) {
    drawingBoard.style.display = 'block';
    guessInput.style.display = 'none';
    currentTurnDisplay.innerText = `Round ${round}: Draw something!`;
  } else {
    drawingBoard.style.display = 'none';
    guessInput.style.display = 'block';
    currentTurnDisplay.innerText = `Round ${round}: Guess what this is!`;
  }
  startTimer(timerDuration);
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
      socket.emit('submit', {
        playerId: socket.id,
        content: drawingBoard.style.display === 'block' 
          ? captureDrawing() 
          : document.getElementById('guess-input-field').value,
      });
    }
  }, 1000);
}

// Capture drawing
function captureDrawing() {
  const canvas = document.getElementById('canvas');
  return canvas.toDataURL(); // Capture as base64 image
}
