const socket = io();
let userName = '';

// === Secret Code Flow ===
document.getElementById('submit-code').addEventListener('click', () => {
  const secretCode = document.getElementById('secret-code').value.trim();
  if (secretCode === "RSS") {
    document.getElementById('auth-container').style.display = 'none';
    document.getElementById('name-container').style.display = 'block';
  } else {
    alert("Incorrect secret code. Try again.");
  }
});

// === Set User Name ===
document.getElementById('submit-name').addEventListener('click', () => {
  const name = document.getElementById('name').value.trim();
  if (name) {
    userName = name;
    socket.emit('set name', { name });
    document.getElementById('name-container').style.display = 'none';
    document.getElementById('chat').style.display = 'flex';
  }
});

// === Send Message ===
document.getElementById('send-btn').addEventListener('click', () => {
  const msgInput = document.getElementById('message');
  const msg = msgInput.value.trim();
  if (msg) {
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    socket.emit('chat message', { sender: userName, msg, time });
    msgInput.value = '';
    socket.emit('stopTyping', userName);
  }
});

// === Typing Event ===
const msgInput = document.getElementById('message');
msgInput.addEventListener('input', () => {
  if (msgInput.value.trim()) {
    socket.emit('typing', userName);
  } else {
    socket.emit('stopTyping', userName);
  }
});

// === Clear Chat ===
document.getElementById('clear-btn').addEventListener('click', () => {
  document.getElementById('messages').innerHTML = '';
});

// === Back to Home ===
document.getElementById('back-btn').addEventListener('click', () => {
  window.location.href = 'https://quick-chat-fumk.onrender.com/';
});

// === Add Message to DOM ===
function addMessageToDOM(data) {
  const isUser = data.sender === userName;
  const message = document.createElement('div');
  message.classList.add('message', isUser ? 'user' : 'friend');

  const timeDisplay = `<div class="timestamp">${data.time}</div>`;

  message.innerHTML = `
    ${!isUser ? `<strong>${data.sender}:</strong>` : ''}
    ${data.msg}
    ${timeDisplay}
  `;

  document.getElementById('messages').prepend(message);
  document.getElementById('messages').scrollTop = document.getElementById('messages').scrollHeight;
}

// === Typing Indicator ===
socket.on('typing', (user) => {
  if (user !== userName) {
    document.getElementById('typing-indicator').textContent = `${user} is typing...`;
    document.getElementById('typing-indicator').style.display = 'block';
  }
});

socket.on('stopTyping', (user) => {
  if (user !== userName) {
    document.getElementById('typing-indicator').style.display = 'none';
  }
});

// === Online Status Indicator ===
socket.on('userStatus', ({ user, status }) => {
  if (user !== userName) {
    const statusDot = document.getElementById('status-dot');
    statusDot.className = status;
  }
});

// === Message History ===
socket.on('chat history', (messages) => {
  messages.forEach(data => addMessageToDOM(data));
});

// === Live Messages ===
socket.on('chat message', (data) => {
  addMessageToDOM(data);
});
