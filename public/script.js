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

// Start the game
socket.on('gameStart', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});

// Receive initial player list
socket.on('initialPlayerList', (playerList) => {
  const playersDiv = document.getElementById('players');
  playersDiv.innerHTML = ''; // Clear existing player names

  // Populate player list
  playerList.forEach(player => {
    const playerItem = document.createElement('p');
    playerItem.textContent = player.name;
    playersDiv.appendChild(playerItem);
  });
});
