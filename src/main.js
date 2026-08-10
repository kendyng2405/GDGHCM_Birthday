// main.js — GDG HCMC 13th Birthday 3D Timeline
// Entry point: Scene setup, camera, scroll sync, HTML generation
import * as THREE from 'three';
import { EVENTS, GOOGLE_COLORS_ARRAY, PHOTO_URLS, YEAR_PHOTOS } from './events.js';
import { createTerrain, createEventMarkers } from './terrain.js';
import { createParticles, createStars, updateParticles } from './particles.js';

// ============================================
// Constants
// ============================================
const UNIT_PER_EVENT = 100;
const TOTAL_LENGTH = EVENTS.length * UNIT_PER_EVENT;
const CAM_START_Z = 20;
const CAM_END_Z = -(TOTAL_LENGTH - UNIT_PER_EVENT / 2);
const CAM_HEIGHT = 6;

// ============================================
// Scene Setup
// ============================================
const canvas = document.getElementById('scene-canvas');
const scene = new THREE.Scene();
scene.background = null;

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 800);
camera.position.set(0, CAM_HEIGHT, CAM_START_Z);

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
  powerPreference: 'high-performance',
});
renderer.setClearColor(0x000000, 0);
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.2;

// ============================================
// Lighting
// ============================================
const ambientLight = new THREE.AmbientLight(0x40407a, 2.5); // Brighter ambient
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0x4285F4, 0x151530, 2.0); // Brighter hemisphere
scene.add(hemiLight);

const moonLight = new THREE.DirectionalLight(0xffffff, 3.0); // Brighter directional light
moonLight.position.set(50, 100, 50);
scene.add(moonLight);

// ============================================
// Terrain
// ============================================
const terrain = createTerrain(TOTAL_LENGTH);
terrain.position.set(0, 0, -TOTAL_LENGTH / 2 + UNIT_PER_EVENT / 2);
scene.add(terrain);

// ============================================
// Event Markers
// ============================================
// Removed markers based on user feedback
// const markers = createEventMarkers(EVENTS, TOTAL_LENGTH);
// markers.position.set(0, 0, 0);
// scene.add(markers);

// ============================================
// Particles & Stars
// ============================================
const particles = createParticles(TOTAL_LENGTH, 70); // Reduced count to prevent network overload
scene.add(particles);

const stars = createStars(1500);
scene.add(stars);

// ============================================
// Camera Path
// ============================================
function getCameraPosition(progress) {
  const z = CAM_START_Z + (CAM_END_Z - CAM_START_Z) * progress;
  const x = Math.sin(progress * Math.PI * 5) * 6;
  const y = CAM_HEIGHT + Math.sin(progress * Math.PI * 3) * 2 + Math.sin(progress * Math.PI * 7) * 0.5;
  return { x, y: Math.max(3, y), z };
}

function getCameraLookAt(progress) {
  const futureProgress = Math.min(1, progress + 0.03);
  const pos = getCameraPosition(futureProgress);
  return { x: pos.x * 0.3, y: pos.y - 1, z: pos.z - 20 };
}

// ============================================
// Generate Timeline HTML
// ============================================
function generateTimeline() {
  const container = document.getElementById('timeline-container');
  if (!container) return;

  const icons = ['🎉', '🚀', '🎬', '☁️', '🎪', '📱', '🔥', '🤖', '🌐', '💡', '🦋', '🏠', '💻', '🎯', '🤖', '🎄', '☁️', '🧠', '🏗️', '🎤', '🎄', '🏗️', '👩‍💻', '🎂'];

  EVENTS.forEach((event, index) => {
    const section = document.createElement('section');
    section.className = 'event-section';
    section.style.color = event.color;
    section.setAttribute('data-year', event.year);
    section.setAttribute('data-index', index);

    const isLeft = index % 2 === 0;
    const isBirthday = event.isBirthday;

    section.innerHTML = `
      <div class="event-inner">
        <div class="event-year-side">
          <div class="event-year-big" style="color: ${event.color}">${event.year}</div>
        </div>
        <div class="event-card-side">
          <div class="event-card ${isBirthday ? 'birthday-card' : ''}" style="--accent: ${event.color}">
            <div style="position:absolute;top:0;left:0;right:0;height:3px;background:${event.color};border-radius:20px 20px 0 0;"></div>
            <div class="event-date" style="color: ${event.color}">${event.date}</div>
            <h3 class="event-title">
              <span class="lang-vi">${event.titleVi}</span>
              <span class="lang-en">${event.titleEn}</span>
            </h3>
            <p class="event-desc">
              <span class="lang-vi">${event.descVi}</span>
              <span class="lang-en">${event.descEn}</span>
            </p>
          </div>
        </div>
      </div>
    `;

    container.appendChild(section);
  });
}

// ============================================
// Scroll Handling
// ============================================
let targetScrollProgress = 0;
let currentScrollProgress = 0;
let currentYear = 2013;
const yearIndicator = document.getElementById('year-indicator');
const yearText = document.getElementById('year-text');
const progressFill = document.getElementById('progress-fill');

const bgLayer1 = document.getElementById('bg-layer-1');
const bgLayer2 = document.getElementById('bg-layer-2');
let activeBgLayer = 1;

function updateBackground(year) {
  if (!bgLayer1 || !bgLayer2) return;
  
  let bgUrl = '';
  // Get photos for current year, fallback to all photos if empty
  let pool = YEAR_PHOTOS[year] && YEAR_PHOTOS[year].length > 0 ? YEAR_PHOTOS[year] : PHOTO_URLS;
  if (pool.length > 0) {
    const photoIndex = Math.floor(Math.random() * pool.length);
    bgUrl = `url('${pool[photoIndex]}')`;
  }

  if (activeBgLayer === 1) {
    bgLayer2.style.backgroundImage = bgUrl;
    bgLayer2.classList.add('active');
    bgLayer1.classList.remove('active');
    activeBgLayer = 2;
  } else {
    bgLayer1.style.backgroundImage = bgUrl;
    bgLayer1.classList.add('active');
    bgLayer2.classList.remove('active');
    activeBgLayer = 1;
  }
}

// Initial background
updateBackground(2013);

function onScroll() {
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  targetScrollProgress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
}

// ============================================
// Intersection Observer for Event Cards
// ============================================
function setupCardAnimations() {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('in-view', entry.isIntersecting);
      });
    },
    { threshold: 0.3, rootMargin: '-10% 0px -10% 0px' }
  );

  document.querySelectorAll('.event-section').forEach((section) => {
    observer.observe(section);
  });
}

// ============================================
// Language Toggle
// ============================================
function setupLangToggle() {
  const btn = document.getElementById('lang-toggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    document.body.classList.toggle('lang-vi');
    document.body.classList.toggle('lang-en');
  });
}

// ============================================
// Confetti Effect
// ============================================
function setupConfetti() {
  const confettiCanvas = document.getElementById('confetti-canvas');
  if (!confettiCanvas) return;
  const ctx = confettiCanvas.getContext('2d');
  confettiCanvas.width = window.innerWidth;
  confettiCanvas.height = window.innerHeight;

  const confettiPieces = [];
  const COLORS = ['#4285F4', '#EA4335', '#FBBC04', '#34A853', '#ffffff'];
  let isActive = false;

  function spawnConfetti() {
    for (let i = 0; i < 150; i++) {
      confettiPieces.push({
        x: Math.random() * confettiCanvas.width,
        y: -20 - Math.random() * 200,
        w: Math.random() * 8 + 4,
        h: Math.random() * 5 + 2,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
        vx: (Math.random() - 0.5) * 3,
        vy: Math.random() * 3 + 2,
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 10,
        opacity: 1,
      });
    }
  }

  function animateConfetti() {
    if (!isActive) return;
    ctx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);

    confettiPieces.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.rotation += p.rotSpeed;
      p.opacity -= 0.003;

      if (p.opacity <= 0 || p.y > confettiCanvas.height + 20) {
        confettiPieces.splice(i, 1);
        return;
      }

      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.globalAlpha = p.opacity;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    });

    if (confettiPieces.length > 0) {
      requestAnimationFrame(animateConfetti);
    } else {
      isActive = false;
      confettiCanvas.classList.remove('active');
    }
  }

  // Trigger confetti when finale is in view
  const finaleObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !isActive) {
          isActive = true;
          confettiCanvas.classList.add('active');
          spawnConfetti();
          animateConfetti();
        }
      });
    },
    { threshold: 0.5 }
  );

  const finale = document.getElementById('finale');
  if (finale) finaleObserver.observe(finale);

  window.addEventListener('resize', () => {
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
  });
}

// ============================================
// Window Resize
// ============================================
function onResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// ============================================
// Animation Loop
// ============================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  const elapsed = clock.getElapsedTime();

  // Smooth scroll interpolation (Lerp)
  currentScrollProgress += (targetScrollProgress - currentScrollProgress) * 0.08;

  // Update camera based on smoothed progress
  const pos = getCameraPosition(currentScrollProgress);
  const lookAt = getCameraLookAt(currentScrollProgress);
  camera.position.set(pos.x, pos.y, pos.z);
  camera.lookAt(lookAt.x, lookAt.y, lookAt.z);

  // Update year indicator & Background
  const eventIndex = Math.floor(currentScrollProgress * EVENTS.length);
  const event = EVENTS[Math.min(eventIndex, EVENTS.length - 1)];
  if (event && event.year !== currentYear) {
    currentYear = event.year;
    updateBackground(currentYear);
    if (yearText) {
      yearText.textContent = currentYear;
      yearText.style.color = event.color;
      yearText.style.textShadow = `0 0 20px ${event.color}80`;
    }
  }
  if (progressFill) {
    progressFill.style.height = `${currentScrollProgress * 100}%`;
  }

  // Show/hide year indicator
  if (yearIndicator) {
    yearIndicator.classList.toggle('visible', currentScrollProgress > 0.02 && currentScrollProgress < 0.95);
  }

  // Animate particles
  updateParticles(particles, elapsed);

  // Slowly rotate stars
  if (stars) {
    stars.rotation.y = elapsed * 0.005;
  }


  renderer.render(scene, camera);
}

// ============================================
// Initialization
// ============================================
function init() {
  generateTimeline();
  setupCardAnimations();
  setupLangToggle();
  setupConfetti();

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onResize);

  // Initial camera position
  onScroll();

  // Start render loop
  animate();

  // Hide loading screen
  setTimeout(() => {
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) loadingScreen.classList.add('hidden');
  }, 800);
}

// Wait for DOM
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
