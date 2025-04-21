const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const socketIO = require('socket.io');
const http = require('http');

// Initialize environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log('MongoDB connected successfully');
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });

// Basic route to check if the server is running
app.get('/', (req, res) => {
  res.send('Welcome to SF_C4C Chat Application!');
});

// Socket.IO chat logic
io.on('connection', (socket) => {
  console.log('A user connected');

  // Listening for chat messages
  socket.on('chat message', (msg) => {
    io.emit('chat message', msg); // Broadcast the message to all clients
  });

  // Handling disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

// Start the server on the specified port
const port = process.env.PORT || 8080;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
