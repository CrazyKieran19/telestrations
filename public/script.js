const socket = io();

// UI Elements
const startButton = document.getElementById('start-button');
const playerList = document.getElementById('player-list');
const wordInputContainer = document.getElementById('word-input-container');
const timerDisplay = document.getElementById('timer');
const finalPresentation = document.getElementById('final-presentation');

// Game state
let playerName = '';
let isHost = false;

// Prompt for player name
function promptForName() {
  const name = prompt("Enter your name:");
  if (name && name.trim() !== "") {
    playerName = name.trim();
    socket.emit('joinGame', playerName);
  } else {
    alert("A name is required to play!");
    promptForName(); // Recursively ask for the name until valid input
  }
}

window.onload = () => {
  promptForName();
};

// Update player list
socket.on('updatePlayers', (players) => {
  playerList.innerHTML = 'Players: ' + players.map(player => player.name).join(', ');
});

// Identify host and show the "Start Game" button when ready
socket.on('gameHost', () => {
  isHost = true;
});

// Enable the "Start Game" button when there are at least 3 players
socket.on('enableStartButton', () => {
  if (isHost) {
    startButton.style.display = 'block';
  }
});

// Disable the "Start Game" button if players drop below 3
socket.on('disableStartButton', () => {
  if (isHost) {
    startButton.style.display = 'none';
  }
});

// Start game when the button is clicked (host only)
startButton.addEventListener('click', () => {
  if (isHost) {
    socket.emit('startGame');
  }
});

// Handle game start
socket.on('gameStarted', ({ timerDuration }) => {
  startButton.style.display = 'none'; // Hide the button
  wordInputContainer.style.display = 'block'; // Show the word input container
  timerDisplay.style.display = 'block'; // Display the timer
  startTimer(timerDuration); // Start the timer
});

// Timer logic
function startTimer(duration) {
  let timeLeft = duration;
  timerDisplay.innerText = `Time left: ${timeLeft}s`;

  const timerInterval = setInterval(() => {
    timeLeft--;
    timerDisplay.innerText = `Time left: ${timeLeft}s`;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      socket.emit('roundOver');
    }
  }, 1000);
}

// Handle final presentation
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
});
