io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  socket.on('joinGame', (playerName) => {
    if (!gameState.isGameStarted) {
      gameState.players.push({ id: socket.id, name: playerName });
      socket.emit('gameState', gameState); // Send game state to the new player
      io.emit('updatePlayers', gameState.players); // Broadcast updated player list

      // Check if the current player is the first to join (host)
      if (gameState.players.length === 1) {
        socket.emit('gameHost');
      }

      // Notify the host to enable the "Start Game" button if there are at least 3 players
      if (gameState.players.length >= 3) {
        const hostSocket = gameState.players[0].id;
        io.to(hostSocket).emit('enableStartButton');
      }
    } else {
      socket.emit('gameFull'); // If the game has started, new players can't join
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    gameState.players = gameState.players.filter(player => player.id !== socket.id);
    io.emit('updatePlayers', gameState.players);

    // If players drop below 3, disable the start button for the host
    if (gameState.players.length < 3 && !gameState.isGameStarted) {
      const hostSocket = gameState.players[0]?.id;
      if (hostSocket) {
        io.to(hostSocket).emit('disableStartButton');
      }
    }
  });
});
