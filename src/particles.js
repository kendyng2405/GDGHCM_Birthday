// particles.js — Floating particles + stars for atmosphere
import * as THREE from 'three';

const GOOGLE_COLORS = [0x4285F4, 0xEA4335, 0xFBBC04, 0x34A853];

// Floating particles along the path
export function createParticles(totalLength, count = 600) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 120;
    positions[i * 3 + 1] = Math.random() * 40 + 2;
    positions[i * 3 + 2] = -Math.random() * totalLength;

    const color = new THREE.Color(GOOGLE_COLORS[i % 4]);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    sizes[i] = Math.random() * 2.5 + 0.5;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

  const material = new THREE.PointsMaterial({
    size: 1.5,
    vertexColors: true,
    transparent: true,
    opacity: 0.6,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    sizeAttenuation: true,
  });

  const points = new THREE.Points(geometry, material);
  points.userData.initialPositions = positions.slice();
  return points;
}

// Stars in the sky dome
export function createStars(count = 2000) {
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);

  for (let i = 0; i < count; i++) {
    // Sphere distribution for sky dome
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.acos(Math.random() * 0.8 + 0.2); // Upper hemisphere bias
    const r = 400 + Math.random() * 200;

    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
    positions[i * 3 + 1] = r * Math.cos(phi);
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

    // Mostly white with some colored stars
    const brightness = 0.5 + Math.random() * 0.5;
    if (Math.random() < 0.1) {
      const c = new THREE.Color(GOOGLE_COLORS[Math.floor(Math.random() * 4)]);
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

// Animate floating particles
export function updateParticles(particles, time) {
  const positions = particles.geometry.attributes.position;
  const initial = particles.userData.initialPositions;
  if (!initial) return;

  for (let i = 0; i < positions.count; i++) {
    const ix = initial[i * 3];
    const iy = initial[i * 3 + 1];
    const iz = initial[i * 3 + 2];

    positions.setX(i, ix + Math.sin(time * 0.3 + i * 0.1) * 2);
    positions.setY(i, iy + Math.sin(time * 0.5 + i * 0.05) * 1.5);
    positions.setZ(i, iz + Math.cos(time * 0.2 + i * 0.08) * 1);
  }

  positions.needsUpdate = true;
}
