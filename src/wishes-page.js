// wishes-page.js — Handle the wishes display page (wishes.html)
import { firebaseConfig } from './firebase-config.js';

let db = null;

function initFirebase() {
  if (db) return;
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  db = firebase.database();
}

const GOOGLE_COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853'];

function formatTime(timestamp) {
  const d = new Date(timestamp);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function createWishCard(wish, key) {
  const card = document.createElement('div');
  card.className = 'wish-card';
  card.style.setProperty('--accent', wish.color || GOOGLE_COLORS[Math.floor(Math.random() * 4)]);
  card.setAttribute('data-key', key);

  card.innerHTML = `
    <div class="wish-card-accent"></div>
    <div class="wish-card-avatar" style="background: ${wish.color || '#4285F4'}">
      ${(wish.name || '?')[0].toUpperCase()}
    </div>
    <div class="wish-card-body">
      <div class="wish-card-name">${wish.name}</div>
      <div class="wish-card-message">${wish.message}</div>
      <div class="wish-card-time">${wish.timestamp ? formatTime(wish.timestamp) : ''}</div>
    </div>
  `;

  // Animate in
  card.style.opacity = '0';
  card.style.transform = 'translateY(30px) scale(0.95)';
  requestAnimationFrame(() => {
    card.style.transition = 'opacity 0.6s ease, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
    card.style.opacity = '1';
    card.style.transform = 'translateY(0) scale(1)';
  });

  return card;
}

export function initWishesPage() {
  initFirebase();

  const grid = document.getElementById('wishes-grid');
  const countEl = document.getElementById('wishes-count');
  const emptyState = document.getElementById('wishes-empty');

  if (!grid || !db) return;

  let wishCount = 0;

  // Listen for new wishes in realtime
  db.ref('wishes').orderByChild('timestamp').on('child_added', (snapshot) => {
    const wish = snapshot.val();
    const card = createWishCard(wish, snapshot.key);

    // Prepend (newest first)
    grid.insertBefore(card, grid.firstChild);

    wishCount++;
    if (countEl) countEl.textContent = wishCount;
    if (emptyState) emptyState.style.display = 'none';
  });

  // Handle empty state
  db.ref('wishes').once('value', (snapshot) => {
    if (!snapshot.exists()) {
      if (emptyState) emptyState.style.display = 'flex';
    }
  });
}
