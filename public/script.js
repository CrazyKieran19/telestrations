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

// Update Player List in Lobby
socket.on('playerListUpdate', (playerList) => {
  players = playerList;
  const playerListDiv = document.getElementById('player-list');
  playerListDiv.innerHTML = `
    <h2>Players</h2>
    ${players.map(player => `<p>${player.name}</p>`).join('')}
  `;

  // Enable or disable start button based on player count
  if (isHost) {
    const startButton = document.getElementById('start-button');
    startButton.disabled = players.length < 3;
    startButton.style.backgroundColor = players.length >= 3 ? '#007bff' : '#ccc';
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
  startButton.style.backgroundColor = players.length >= 3 ? '#007bff' : '#ccc';
});

// Start the Game
socket.on('gameStart', () => {
  document.getElementById('lobby').style.display = 'none';
  document.getElementById('game').style.display = 'block';
});

// Initial Update of Player List
socket.on('initialPlayerList', (playerList) => {
  players = playerList;
  const playerListDiv = document.getElementById('player-list');
  playerListDiv.innerHTML = `
    <h2>Players</h2>
    ${players.map(player => `<p>${player.name}</p>`).join('')}
  `;
});
