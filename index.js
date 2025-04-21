const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files
app.use('/style.css', express.static(path.join(__dirname, 'style.css')));
app.use('/SF_Home_Page.css', express.static(path.join(__dirname, 'SF_Home_Page.css')));
app.use('/client.js', express.static(path.join(__dirname, 'client.js')));

// Routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'SF_Home_Page.html'));
});

app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 🔁 In-memory chat history
const chatHistory = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send chat history to new user
  socket.emit('chat history', chatHistory);

  socket.on('set name', (data) => {
    socket.username = data.name;
    socket.emit('name set', { name: data.name });
  });

  socket.on('chat message', (data) => {
    data.status = 'sent';

    // Save message in history
    chatHistory.push(data);

    io.emit('chat message', data);
  });

  socket.on('message seen', (data) => {
    data.status = 'seen';
    io.emit('update status', data);
  });

  socket.on('disconnect', () => {
    console.log('A user disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
