const socketio = require('socket.io');
const io = socketio(server); // `server` je tvůj HTTP server

io.on('connection', (socket) => {
  console.log('Nové připojení: ' + socket.id);

  socket.on('sendMessage', (data) => {
    // Předání zprávy druhému uživateli
    io.to(data.receiverId).emit('newMessage', data.message);
  });
});

