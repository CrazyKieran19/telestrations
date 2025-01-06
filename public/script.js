const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const drawingBoard = document.getElementById('drawing-board');
const guessInput = document.getElementById('guess-input');
const submitButton = document.getElementById('submit-button');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const timerDisplay = document.getElementById('timer');

let isMyTurn = false;
let currentTask = '';

// Join the game
const playerName = prompt("Enter your name:");
socket.emit('joinGame', playerName);

// Update player list
socket.on('updatePlayers', (players) => {
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Show current player's turn
socket.on('currentTurn', (playerName) => {
  document.getElementById('current-turn').innerText = `It's ${playerName}'s turn.`;
});

// Your turn to play
socket.on('yourTurn', ({ task, prompt, timer }) => {
  isMyTurn = true;
  currentTask = task;
  if (task === 'draw') {
    drawingBoard.style.display = 'block';
    guessInput.style.display = 'none';
  } else if (task === 'guess') {
    drawingBoard.style.display = 'none';
    guessInput.style.display = 'block';
    document.getElementById('prompt-display').innerText = `Guess this: ${prompt}`;
  }

  // Start timer
  let timeLeft = timer;
  const interval = setInterval(() => {
    timerDisplay.innerText = `Time left: ${timeLeft}s`;
    if (--timeLeft <= 0) {
      clearInterval(interval);
    }
  }, 1000);
});

// Submit drawing
submitButton.addEventListener('click', () => {
  if (currentTask === 'draw') {
    const drawing = canvas.toDataURL();
    socket.emit('submitDrawing', drawing);
  } else if (currentTask === 'guess') {
    const guess = document.getElementById('guess-input').value;
    socket.emit('submitGuess', guess);
  }
  isMyTurn = false;
});

// Game Over
socket.on('gameOver', (message) => {
  alert(message);
  location.reload(); // Reload the page to reset the game
});
