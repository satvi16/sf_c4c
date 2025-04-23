const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const connectedUsers = {}; // Store socket.id → username
const users = {};  // username -> [socketIds]

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


app.get('/call', (req, res) => {
  res.sendFile(path.join(__dirname, 'call.html'));
});


// 🔁 In-memory chat history
const chatHistory = [];

io.on('connection', (socket) => {
  console.log('A user connected');

  // Send chat history to new user
  socket.emit('chat history', chatHistory);
  
socket.on('set name', (data) => {
  socket.username = data.name;
  if (!users[data.name]) {
    users[data.name] = [];
  }
  users[data.name].push(socket.id);

  // Notify others that user is online
  socket.broadcast.emit('userStatus', { user: data.name, status: 'online' });

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
  const name = socket.username;
  if (!name) return;

  if (users[name]) {
    users[name] = users[name].filter(id => id !== socket.id);
    if (users[name].length === 0) {
      delete users[name];
      socket.broadcast.emit('userStatus', { user: name, status: 'offline' });
    }
  }

  console.log(`${name || 'A user'} disconnected`);
});


  socket.on('webrtc-offer', (data) => {
  socket.broadcast.emit('webrtc-offer', data);
});

socket.on('webrtc-answer', (data) => {
  socket.broadcast.emit('webrtc-answer', data);
});

socket.on('webrtc-candidate', (candidate) => {
  socket.broadcast.emit('webrtc-candidate', candidate);
});

});


const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
