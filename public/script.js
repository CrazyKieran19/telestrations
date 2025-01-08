const socket = io();

// Prompt for player name
let playerName = prompt("Enter your name:");
if (!playerName || playerName.trim() === "") {
  playerName = "Anonymous"; // Default name if blank
}
socket.emit('joinGame', playerName);

// Game variables
let isHost = false;

// Update player list and manage start button
socket.on('playerListUpdate', (playerList) => {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = playerList.map(player => `<p>${player.name}</p>`).join('');

  // Enable or disable start button based on player count
  if (isHost) {
    const startButton = document.getElementById('start-button');
    startButton.style.display = 'block';
    startButton.disabled = playerList.length < 3;
    startButton.style.backgroundColor = playerList.length >= 3 ? '#007bff' : '#ccc';
  }
});

// Handle host status
socket.on('youAreHost', () => {
  isHost = true;
  const startButton = document.getElementById('start-button');
  startButton.style.display = 'block';
});

// Start button functionality
document.getElementById('start-button').addEventListener('click', () => {
  socket.emit('startGame');
});

// Start the game
socket.on('gameStart', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});

// Initial update of player list
socket.on('initialPlayerList', (playerList) => {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = playerList.map(player => `<p>${player.name}</p>`).join('');
});
