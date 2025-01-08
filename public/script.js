const socket = io();

// Prompt for Player Name
let playerName = prompt("Enter your name:");
if (!playerName || playerName.trim() === "") {
  playerName = "Anonymous"; // Default name if none provided
}
socket.emit('joinGame', playerName);

// Game Variables
let isHost = false;
let players = [];
let currentRound = 0;
let words = [];
let submittedWords = {};
let submittedDrawings = {};

// Lobby Actions
socket.on('playerListUpdate', (playerList) => {
  players = playerList;
  const playerListDiv = document.getElementById('player-list');
  playerListDiv.innerHTML = players.map(player => player.name).join('<br>');

  if (isHost && players.length >= 3) {
    const startButton = document.getElementById('start-button');
    startButton.style.display = 'block';
    startButton.disabled = false;
  }
});

// Start Game Button
document.getElementById('start-button').addEventListener('click', () => {
  if (players.length < 3) {
    alert("You need at least 3 players to start the game!");
    return;
  }
  socket.emit('startGame');
});

// Handle Host Status
socket.on('youAreHost', () => {
  isHost = true;
  const startButton = document.getElementById('start-button');
  startButton.style.display = 'block';
  startButton.disabled = players.length < 3; // Enable only if 3+ players
});

// Game Starts
socket.on('gameStart', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
  startWordRound();
});

// Word Round
function startWordRound() {
  document.getElementById('game-title').innerText = 'What is your word?';
  document.getElementById('word-round').style.display = 'block';

  document.getElementById('submit-word').addEventListener('click', () => {
    const wordInput = document.getElementById('word-input').value;
    if (wordInput.trim() === '') {
      alert("Please enter a word!");
      return;
    }
    socket.emit('submitWord', wordInput);
    document.getElementById('word-round').style.display = 'none';
    document.getElementById('game-title').innerText = 'Waiting for others...';
  });
}

socket.on('allWordsSubmitted', (receivedWords) => {
  words = receivedWords;
  startDrawingRound();
});

// Drawing Round
function startDrawingRound() {
  const playerIndex = players.findIndex(player => player.id === socket.id);
  const wordToDraw = words[(playerIndex - 1 + players.length) % players.length]; // Last player's word

  document.getElementById('game-title').innerText = 'Draw this word!';
  document.getElementById('word-prompt').innerText = `Draw this word: ${wordToDraw}`;
  document.getElementById('drawing-round').style.display = 'block';

  setupCanvas();

  document.getElementById('submit-drawing').addEventListener('click', () => {
    const canvas = document.getElementById('canvas');
    const drawingData = canvas.toDataURL();
    socket.emit('submitDrawing', drawingData);
    document.getElementById('drawing-round').style.display = 'none';
    document.getElementById('game-title').innerText = 'Waiting for others...';
  });
}

socket.on('allDrawingsSubmitted', (receivedDrawings) => {
  submittedDrawings = receivedDrawings;
  // Proceed to next round or present the final results.
});

// Canvas Setup for Drawing
function setupCanvas() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  let drawing = false;

  canvas.addEventListener('mousedown', () => drawing = true);
  canvas.addEventListener('mouseup', () => drawing = false);
  canvas.addEventListener('mousemove', (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  });
}
