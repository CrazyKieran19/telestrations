const socket = io();

const playerName = prompt("Enter your name:");
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const drawingBoard = document.getElementById('drawing-board');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const submitButton = document.getElementById('submit-drawing');
const wordInput = document.getElementById('word-input');
const timerDisplay = document.getElementById('timer-display');
const currentRoundDisplay = document.getElementById('current-round');
let players = [];
let isHost = false;
let roundData = []; // Holds words or drawings for each round
let currentRound = 1;
let isWriting = true; // Track if the current round is writing
let submitted = false;

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
socket.on('gameStart', () => {
  startButton.style.display = 'none';
  startRound();
});

// Timer update
socket.on('updateTimer', (timer) => {
  timerDisplay.textContent = timer;
});

// Handle round timeout
socket.on('roundTimeout', () => {
  if (!submitted) {
    handleSubmit();
  }
});

// Start button click event
startButton.addEventListener('click', () => {
  if (players.length >= 3) {
    socket.emit('startGame');
  } else {
    alert('You need at least 3 players to start the game.');
  }
});

// Handle submit button click
submitButton.addEventListener('click', () => {
  if (!submitted) {
    handleSubmit();
  }
});

// Handle submit logic
function handleSubmit() {
  submitted = true;
  submitButton.textContent = 'Submitted';
  let submission;

  if (isWriting) {
    submission = wordInput.value.trim();
    if (!submission) {
      alert('Please enter a word.');
      return;
    }
  } else {
    submission = canvas.toDataURL(); // Capture the drawing as an image
  }

  socket.emit('submitRound', { submission, round: currentRound });
}

// Receive submissions and advance the round
socket.on('advanceRound', (data) => {
  roundData = data;
  currentRound++;

  if (currentRound > players.length) {
    endGame();
  } else {
    isWriting = !isWriting;
    startRound();
  }
});

// Start a new round
function startRound() {
  submitted = false;
  submitButton.textContent = 'Submit';
  currentRoundDisplay.textContent = `Round ${currentRound}`;

  if (isWriting) {
    wordInput.style.display = 'block';
    drawingBoard.style.display = 'none';

    const previousWord = getPreviousWord();
    wordInput.value = previousWord ? `Guess this word: ${previousWord}` : '';
  } else {
    wordInput.style.display = 'none';
    drawingBoard.style.display = 'block';
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const previousDrawing = getPreviousDrawing();
    // Display previous drawing (not implemented here)
  }
}

// Get the previous word for this player
function getPreviousWord() {
  const index = players.findIndex((player) => player.name === playerName);
  const previousIndex = (index - 1 + players.length) % players.length;
  return roundData[previousIndex]?.submission || '';
}

// Get the previous drawing for this player
function getPreviousDrawing() {
  const index = players.findIndex((player) => player.name === playerName);
  const previousIndex = (index - 1 + players.length) % players.length;
  return roundData[previousIndex]?.submission || null;
}

// End game logic
function endGame() {
  alert('Game over! Showing results...');
  // Display results (not implemented here)
}

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
