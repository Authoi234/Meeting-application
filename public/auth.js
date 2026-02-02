import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCZE-3evmACrGddfmL7Q8Z8oRCthkcY8dk",
  authDomain: "authoi-s-meeting.firebaseapp.com",
  projectId: "authoi-s-meeting",
  appId: "1:25047396704:web:8a8486aa5195fc6f826e05"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.currentUser = null;

onAuthStateChanged(auth, (user) => {
  window.currentUser = user;
});
// Button logic
document.getElementById('startMeeting').addEventListener('click', () => {
  if (currentUser) {
    window.location.href = '/meeting';
  } else {
    document.getElementById('authModal').showModal();
  }
});

window.login = async () => {
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;

  try {
    await signInWithEmailAndPassword(auth, email, password);
    window.location.href = '/meeting';
  } catch (error) {
    alert(error.message);
  }
};

window.signup = async () => {
  const name = document.getElementById('signupName').value;
  let photoURL = document.getElementById('signupPhoto').value;
  photoURL = photoURL || "https://www.pngkey.com/png/full/204-2049354_ic-account-box-48px-profile-picture-icon-square.png";

  const email = document.getElementById('signupEmail').value;
  const password = document.getElementById('signupPassword').value;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, {
      displayName: name,
      photoURL: photoURL
    });

    window.location.href = '/meeting';
  } catch (error) {
    alert(error.message);
  }
};

window.auth = auth;