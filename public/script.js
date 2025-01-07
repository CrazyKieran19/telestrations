const socket = io();
let isSubmitted = false;
let currentRoundType = 'writing';

// Ask for player name
const playerName = prompt('Enter your name:');
socket.emit('joinGame', playerName);

// Elements
const playerList = document.getElementById('player-list');
const startButton = document.getElementById('start-button');
const submitButton = document.getElementById('submit-drawing');
const timerElement = document.getElementById('timer');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Track timer interval
let timerInterval;

socket.on('gameHost', () => {
  startButton.style.display = 'block';
});

socket.on('enableStartButton', () => {
  startButton.disabled = false;
});

socket.on('disableStartButton', () => {
  startButton.disabled = true;
});

startButton.addEventListener('click', () => {
  socket.emit('startGame');
  startButton.disabled = true;  // Disable the button once clicked
});

submitButton.addEventListener('click', () => {
  if (!isSubmitted) {
    const drawingData = canvas.toDataURL();
    socket.emit('submit', { type: 'drawing', data: drawingData });
    submitButton.textContent = 'Submitted';
    isSubmitted = true;
  }
});

socket.on('updatePlayers', (players) => {
  playerList.innerHTML = players
    .map((player) => `<li>${player.name}</li>`)
    .join('');
});

socket.on('startRound', ({ round, maxRounds, timerDuration, roundType }) => {
  isSubmitted = false;
  submitButton.textContent = 'Submit';

  currentRoundType = roundType;  // Update round type (writing or drawing)

  timerElement.textContent = `Round ${round} / ${maxRounds} - Time Left: ${timerDuration}s`;
  clearInterval(timerInterval);

  let timeLeft = timerDuration;
  timerInterval = setInterval(() => {
    timeLeft--;
    timerElement.textContent = `Round ${round} / ${maxRounds} - Time Left: ${timeLeft}s`;
    if (timeLeft <= 0) {
      clearInterval(timerInterval);
    }
  }, 1000);
});

socket.on('endGame', (finalState) => {
  clearInterval(timerInterval);
  alert('Game Over! Check out the final results.');
  console.log('Final Game State:', finalState);
});

socket.on('gameStarted', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});
