const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static(__dirname + '/public'));  // Serve static files

let waitingPeer = null;  // Holds the peer waiting for a connection

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // User asks to find a stranger
  socket.on('findStranger', () => {
    if (waitingPeer) {
      // Connect with the waiting peer
      io.to(waitingPeer).emit('connectPeer');
      io.to(socket.id).emit('connectPeer');
      waitingPeer = null;  // Reset waiting peer
    } else {
      waitingPeer = socket.id;  // Set the current socket as the waiting peer
    }
  });

  // Handle offer from one peer and forward it to another
  socket.on('offer', (offer) => {
    socket.broadcast.emit('offer', offer);
  });

  // Handle answer from one peer and forward it to another
  socket.on('answer', (answer) => {
    socket.broadcast.emit('answer', answer);
  });

  // Handle ICE candidates
  socket.on('ice-candidate', (candidate) => {
    socket.broadcast.emit('ice-candidate', candidate);
  });

  socket.on('disconnect', () => {
    if (waitingPeer === socket.id) {
      waitingPeer = null;  // Reset waiting peer on disconnect
    }
    console.log('User disconnected:', socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
