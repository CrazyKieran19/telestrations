const socket = io();

// Prompt for player name
let playerName = prompt("Enter your name:");
if (!playerName || playerName.trim() === "") {
  playerName = "Anonymous"; // Default name if blank
}
socket.emit('joinGame', playerName);

// Game variables
let isHost = false;

// Update player list
socket.on('playerListUpdate', (playerList) => {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = ''; // Clear existing player names

  // Add each player to the list
  playerList.forEach(player => {
    const playerItem = document.createElement('p');
    playerItem.textContent = player.name;
    playersDiv.appendChild(playerItem);
  });

  // Show and enable/disable start button for the host
  const startButton = document.getElementById('start-button');
  if (isHost) {
    startButton.style.display = 'block';
    startButton.disabled = playerList.length < 3;
    startButton.style.backgroundColor = playerList.length >= 3 ? '#007bff' : '#ccc';
  }
});

// Assign host status
socket.on('youAreHost', () => {
  isHost = true;
  const startButton = document.getElementById('start-button');
  startButton.style.display = 'block'; // Show the start button for the host
});

// Handle start button click
document.getElementById('start-button').addEventListener('click', () => {
  socket.emit('startGame');
});

// Game start
socket.on('gameStart', (gameState) => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';

  // Handle writing phase
  if (gameState.currentRound % 2 === 0) {
    document.getElementById('writing-container').style.display = 'block';
    document.getElementById('current-word').textContent = 'Write your word:';
  }
  // Handle drawing phase
  else {
    document.getElementById('drawing-container').style.display = 'block';
    document.getElementById('drawing-word').textContent = `Draw this word: ${gameState.rounds[gameState.currentRound - 1].word}`;
  }
});

// Drawing submission
document.getElementById('submit-drawing').addEventListener('click', () => {
  const canvas = document.getElementById('drawing-board');
  const ctx = canvas.getContext('2d');
  const drawing = canvas.toDataURL();
  socket.emit('sendDrawing', drawing);
});

// Writing submission
document.getElementById('submit-write').addEventListener('click', () => {
  const writeInput = document.getElementById('write-input').value;
  socket.emit('sendDrawing', writeInput);
});

// Handle round timeout
socket.on('roundTimeout', (gameState) => {
  document.getElementById('progression').innerHTML = 'Time is up! Moving to the next round...';
  // Advance to the next round
  socket.emit('sendDrawing', 'timeout');
});

// Handle everyone submitted
socket.on('allSubmitted', (gameState) => {
  document.getElementById('progression').innerHTML = 'All players have submitted. Moving to the next round...';
  // Advance to the next round
  socket.emit('sendDrawing', 'submitted');
});
