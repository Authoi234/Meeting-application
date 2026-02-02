const chatHeader = document.querySelector('.main-header');
const chatPanel = document.querySelector('.main_left');

if (chatHeader && chatPanel && !document.getElementById('chat-close')) {
  const closeBtn = document.createElement('span');
  closeBtn.id = 'chat-close';
  closeBtn.innerHTML = '&times;';
  chatHeader.appendChild(closeBtn);

  closeBtn.addEventListener('click', () => {
    chatPanel.classList.remove('active');
  });
}


const peers = {};

function getUserPayload() {
  const user = window.currentUser;

  if (!user) {
    return {
      uid: 'guest',
      name: 'Guest',
      photo: 'https://www.pngkey.com/png/full/204-2049354_ic-account-box-48px-profile-picture-icon-square.png'
    };
  }

  return {
    uid: user.uid,
    name: user.displayName || user.email || 'User',
    photo: user.photoURL || 'https://www.pngkey.com/png/full/204-2049354_ic-account-box-48px-profile-picture-icon-square.png'
  };
}

const socket = io('/');
const videoGrid = document.getElementById('video-grid');
const myVideo = document.createElement('video');
myVideo.muted = true;

let peer;
let myVideoStream;

/* ================= START APP ================= */


async function start() {
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
      const payload = {
        text: text.val(),
        user: getUserPayload()
      };

      socket.emit('message', payload);
      text.val('');
    }
  });

  socket.on('createMessage', ({ text, user }) => {
    $('.messages').append(`
    <li class="flex gap-0 items-start p-2 text-white">
      <div>
         <img src="${user.photo}" class="w-10 h-10 rounded-full" />
    <p class="text-sm mb-0 leading-tight opacity-80">${user.name}</p>
      </div>
      <div class="flex flex-col ">
        <div class="chat chat-start ">
          <div class="chat-bubble chat-bubble-primary">
            ${text}
          </div>
       </div>
      </div>
    </li>
    `);

    scrollToBottom();
  });
};

(async function waitForAuthThenStart() {
  while (window.currentUser === null) {
    await new Promise(r => setTimeout(r, 50));
  }

  start();
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
    port: location.protocol === 'https:' ? 443 : location.port,
    secure: location.protocol === 'https:',
    config: { iceServers }
  });

  peer.on('open', id => {
    console.log('peer open:', id);
    socket.emit('join-room', ROOM_ID, id);
  });

  peer.on('call', call => {
    call.answer(myVideoStream);
    const video = document.createElement('video');

    call.on('stream', userVideoStream => {
      addVideoStream(video, userVideoStream);
    });

    call.on('close', () => {
      video.remove();
    });
  });

  socket.on('user-disconnected', userId => {
    console.log('user disconnected:', userId);

    if (peers[userId]) {
      peers[userId].close();
      delete peers[userId];
    }
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

  peers[userId] = call;

  call.on('stream', userVideoStream => {
    addVideoStream(video, userVideoStream);
  });

  call.on('close', () => {
    video.remove();
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
