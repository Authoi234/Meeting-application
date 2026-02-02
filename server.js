const express = require('express');
const axios = require('axios');
const app = express();
app.set('trust proxy', 1);
require('dotenv').config();
const server = require("http").Server(app);
const io = require('socket.io')(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
}); const { v4: uuidv4 } = require('uuid');
const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
  path: '/'
});
app.set('view engine', 'ejs');
app.use(express.static('public'));

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
  res.render('index');
});

app.get('/ice', async (req, res) => {
  try {
    const response = await axios.put(
      'https://global.xirsys.net/_turn/authois-zoom-meeting-app',
      { format: 'urls' },
      {
        auth: {
          username: process.env.ICE_SERVER_USERNAME,
          password: process.env.ICE_SERVER_PASSWORD
        }
      }
    );
    res.json(response.data.v.iceServers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ICE fetch failed' });
  }
});

app.get('/meeting', (req, res) => {
  res.redirect(`/meeting/${uuidv4()}`);
})

app.get('/meeting/:room', (req, res) => {
  res.render('room', { roomId: req.params.room });
})


io.on('connection', socket => {
  let currentRoom = null;

  socket.on('join-room', (roomId, userId) => {
    currentRoom = roomId;
    socket.join(roomId);
    socket.to(roomId).emit('user-connected', userId);
  });

  socket.on('message', data => {
    if (!currentRoom) return;
    io.to(currentRoom).emit('createMessage', data);
  });

  socket.on('disconnect', () => {
    if (currentRoom) {
      socket.to(currentRoom).emit('user-disconnected', socket.id);
    }
  });
});




server.listen(process.env.PORT || 5000);