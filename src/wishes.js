// wishes.js — Handle wish submission form on the main page
import { firebaseConfig } from './firebase-config.js';

let db = null;

function initFirebase() {
  if (db) return;
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
}

// Sanitize text input
function sanitize(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

export function setupWishForm() {
  const form = document.getElementById('wish-form');
  const nameInput = document.getElementById('wish-name');
  const messageInput = document.getElementById('wish-message');
  const submitBtn = document.getElementById('wish-submit');
  const successMsg = document.getElementById('wish-success');
  const errorMsg = document.getElementById('wish-error');

  if (!form) return;

  initFirebase();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = nameInput.value.trim();
    const message = messageInput.value.trim();

    if (!name || !message) {
      showError('Vui lòng điền đầy đủ tên và lời chúc nhé!');
      return;
    }

    if (message.length > 500) {
      showError('Lời chúc tối đa 500 ký tự thôi nhé!');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Đang gửi...';

    try {
      await db.ref('wishes').push({
        name: sanitize(name),
        message: sanitize(message),
        timestamp: firebase.database.ServerValue.TIMESTAMP,
        color: ['#4285F4', '#EA4335', '#FBBC04', '#34A853'][Math.floor(Math.random() * 4)]
      });

      nameInput.value = '';
      messageInput.value = '';
      showSuccess();
    } catch (err) {
      console.error('Firebase write error:', err);
      showError('Có lỗi xảy ra, vui lòng thử lại!');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Gửi lời chúc';
    }
  });

  function showSuccess() {
    if (successMsg) {
      successMsg.style.display = 'block';
      successMsg.style.opacity = '1';
      setTimeout(() => {
        successMsg.style.opacity = '0';
        setTimeout(() => { successMsg.style.display = 'none'; }, 500);
      }, 3000);
    }
  }

  function showError(msg) {
    if (errorMsg) {
      errorMsg.textContent = msg;
      errorMsg.style.display = 'block';
      errorMsg.style.opacity = '1';
      setTimeout(() => {
        errorMsg.style.opacity = '0';
        setTimeout(() => { errorMsg.style.display = 'none'; }, 500);
      }, 3000);
    }
  }
}
