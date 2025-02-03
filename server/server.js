const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

let waitingUser = null;

// Serve static files
app.use(express.static('public'));

// Handle incoming connections
io.on('connection', (socket) => {
    console.log('New user connected:', socket.id);

    socket.on('start', () => {
        if (waitingUser) {
            // Connect the two users
            socket.emit('video', waitingUser.stream);
            waitingUser.socket.emit('video', socket.stream);
            waitingUser = null;
        } else {
            // Wait for another user to connect
            waitingUser = { socket: socket, stream: socket.stream };
        }
    });

    socket.on('next', () => {
        socket.emit('video', null);
    });

    socket.on('offer', (offer) => {
        if (waitingUser) {
            waitingUser.socket.emit('offer', offer);
        }
    });

    socket.on('answer', (answer) => {
        if (waitingUser) {
            waitingUser.socket.emit('answer', answer);
        }
    });

    socket.on('candidate', (candidate) => {
        if (waitingUser) {
            waitingUser.socket.emit('candidate', candidate);
        }
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

server.listen(3000, () => {
    console.log('Server running on port 3000');
});
