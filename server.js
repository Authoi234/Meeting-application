const express = require('express');
const axios = require('axios');
const app = express();
app.set('trust proxy', 1);
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
    res.redirect(`/${uuidv4()}`);
})

app.get('/ice', async (req, res) => {
  try {
    const response = await axios.put(
      'https://global.xirsys.net/_turn/authois-zoom-meeting-app',
      { format: 'urls' },
      {
        auth: {
          username: 'Authoi123',
          password: '90a89022-f5d6-11f0-a5e2-0242ac140002'
        }
      }
    );
    res.json(response.data.v.iceServers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'ICE fetch failed' });
  }
});

app.get('/:room', (req, res) => {
    res.render('room', { roomId: req.params.room });
})

io.on('connection', socket => {
    socket.on('join-room', (roomId, userId) => {
        socket.join(roomId);
        socket.to(roomId).emit('user-connected', userId);
        socket.on('message', message => {
            io.to(roomId).emit('createMessage', message);
        })
    });
});




server.listen(process.env.PORT || 5000);