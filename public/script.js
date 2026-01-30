const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let peer;
let myVideoStream;

/* ================= START APP ================= */
(async function start() {
  // 1️⃣ Get camera & mic FIRST
  myVideoStream = await navigator.mediaDevices.getUserMedia({
    video: true,
    audio: true
  });

  addVideoStream(myVideo, myVideoStream);

  // 2️⃣ Init Peer AFTER media
  await initPeer();

  // 3️⃣ Chat
  let text = $('input');
  $('html').keydown((e) => {
    if (e.which === 13 && text.val().length !== 0) {
      socket.emit('message', text.val());
      text.val('');
    }
  });

  socket.on('createMessage', message => {
    $('.messages').append(
      `<li class="list-group-item text-white"><b>User</b><br/>${message}</li>`
    );
    scrollToBottom();
  });
})();

/* ================= PEER INIT ================= */
async function initPeer() {
  const res = await fetch('/ice');
  const data = await res.json();

  const iceServers = [
    {
      urls: data.urls,
      username: data.username,
      credential: data.credential
    }
  ];

  peer = new Peer(undefined, {
    path: '/peerjs',
    host: location.hostname,
    secure: true,
    port: 443,
    config: { iceServers }
  });

  peer.on('open', id => {
    console.log('peer open:', id);
    socket.emit('join-room', ROOM_ID, id);
  });

  peer.on('call', call => {
    console.log('incoming call');
    call.answer(myVideoStream);
    const video = document.createElement('video');
    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });
  });

  socket.on('user-connected', userId => {
    console.log('calling user', userId);
    connectToNewUser(userId);
  });
}


/* ================= CALL NEW USER ================= */
function connectToNewUser(userId) {
  const call = peer.call(userId, myVideoStream);
  const video = document.createElement('video');
  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });
}

/* ================= VIDEO ================= */
function addVideoStream(video, stream) {
  video.srcObject = stream;
  video.addEventListener('loadedmetadata', () => {
    video.play();
  });
  videoGrid.append(video);
}

/* ================= CHAT ================= */
function scrollToBottom() {
  const d = $('.main-chat-window');
  d.scrollTop(d.prop('scrollHeight'));
}

/* ================= AUDIO ================= */
function MuteUnmute() {
  const enabled = myVideoStream.getAudioTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getAudioTracks()[0].enabled = false;
    setUnMuteButton();
  } else {
    myVideoStream.getAudioTracks()[0].enabled = true;
    setMuteButton();
  }
}

function setMuteButton() {
  document.querySelector('.main-mute-btn').innerHTML = `
    <i class="mute fas fa-microphone"></i>
    <span>Mute</span>
  `;
}

function setUnMuteButton() {
  document.querySelector('.main-mute-btn').innerHTML = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
  `;
}

/* ================= VIDEO TOGGLE ================= */
function playStop() {
  let enabled = myVideoStream.getVideoTracks()[0].enabled;
  if (enabled) {
    myVideoStream.getVideoTracks()[0].enabled = false;
    setPlayVideo();
  } else {
    myVideoStream.getVideoTracks()[0].enabled = true;
    setStopVideo();
  }
}

function setStopVideo() {
  document.querySelector('.main-video-btn').innerHTML = `
    <i class="on fas fa-video"></i>
    <span>Stop Video</span>
  `;
}

function setPlayVideo() {
  document.querySelector('.main-video-btn').innerHTML = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
  `;
}
