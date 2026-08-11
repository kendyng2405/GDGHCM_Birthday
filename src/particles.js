// particles.js — Floating GDG Photos instead of simple particles
import * as THREE from 'three';
import { GOOGLE_COLORS_ARRAY, PHOTO_URLS } from './events.js';

// Floating Photo Sprites along the path
export function createParticles(totalLength, count = 50) {
  const group = new THREE.Group();
  
  const textureLoader = new THREE.TextureLoader();
  
  // Pick a random subset of URLs to prevent loading 800+ textures at startup
  const shuffled = [...PHOTO_URLS].sort(() => 0.5 - Math.random());
  const selectedUrls = shuffled.slice(0, count);
  const textures = selectedUrls.map(url => {
    const tex = textureLoader.load(url);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });

  const initialPositions = [];

  for (let i = 0; i < count; i++) {
    // Pick the texture sequentially from our subset
    const tex = textures[i % textures.length];
    
    const material = new THREE.SpriteMaterial({
      map: tex,
      color: 0xffffff,
      transparent: true,
      opacity: 0.85
    });

    const sprite = new THREE.Sprite(material);

    // Randomize positions evenly across the screen (removed mountains allows lower placement)
    const x = (Math.random() - 0.5) * 80; // Spread horizontally
    const y = (Math.random() - 0.5) * 40; // Spread vertically from -20 to +20
    
    // Start spawning deeper into the timeline (-80) so they don't block the intro text
    const z = -80 - Math.random() * totalLength; // Spread along the path

    sprite.position.set(x, y, z);
    
    // Scale sprite to a reasonable photo size, making them much larger as requested
    const scaleFactor = Math.random() * 15 + 35; // Range: 35 to 50 (massive)
    sprite.scale.set(scaleFactor * 1.5, scaleFactor, 1);

    group.add(sprite);

    initialPositions.push({ x, y, z, phase: Math.random() * Math.PI * 2 });
  }

  group.userData.initialPositions = initialPositions;
  return group;
}

// Stars in the sky dome (Keep this for atmosphere)
export function createStars(count = 2000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.8 + 0.2); 
    const r = 400 + Math.random() * 200;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    const brightness = 0.5 + Math.random() * 0.5;
    if (Math.random() < 0.1) {
      const c = new THREE.Color(GOOGLE_COLORS_ARRAY[Math.floor(Math.random() * 4)]);
      colors[i * 3] = c.r * brightness;
      colors[i * 3 + 1] = c.g * brightness;
      colors[i * 3 + 2] = c.b * brightness;
    } else {
      colors[i * 3] = brightness;
      colors[i * 3 + 1] = brightness;
      colors[i * 3 + 2] = brightness * (0.9 + Math.random() * 0.1);
    }
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  const material = new THREE.PointsMaterial({
    size: 1.2,
    vertexColors: true,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  return new THREE.Points(geometry, material);
}

// Animate floating photos
export function updateParticles(particleGroup, time, scrollProgress = 1) {
  const initial = particleGroup.userData.initialPositions;
  if (!initial) return;

  // Fade opacity from 0 to 0.85 when scrollProgress goes from 0.01 to 0.05
  const targetOpacity = Math.max(0, Math.min(1, (scrollProgress - 0.01) * 25)) * 0.85;

  // Completely hide them from the DOM rendering if opacity is 0 to save performance
  particleGroup.visible = targetOpacity > 0;

  if (targetOpacity > 0) {
    particleGroup.children.forEach((sprite, i) => {
      const data = initial[i];
      // Gentle floating effect for photos
      sprite.position.x = data.x + Math.sin(time * 0.2 + data.phase) * 3;
      sprite.position.y = data.y + Math.sin(time * 0.3 + data.phase * 2) * 2;
      
      // Update opacity
      sprite.material.opacity = targetOpacity;
    });
  }
}

