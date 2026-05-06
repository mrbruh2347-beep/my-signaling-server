const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const users = new Map();

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('register', (userId) => {
    users.set(userId, socket.id);
    console.log(`User registered: ${userId}`);
  });

  socket.on('call_user', (data) => {
    const targetSocket = users.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit('incoming_call', {
        from: data.from,
        offer: data.offer
      });
    }
  });

  socket.on('accept_call', (data) => {
    const targetSocket = users.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit('call_accepted', { answer: data.answer });
    }
  });

  socket.on('ice_candidate', (data) => {
    const targetSocket = users.get(data.to);
    if (targetSocket) {
      io.to(targetSocket).emit('ice_candidate', { candidate: data.candidate });
    }
  });

  socket.on('disconnect', () => {
    users.forEach((value, key) => {
      if (value === socket.id) users.delete(key);
    });
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
