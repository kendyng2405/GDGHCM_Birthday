// particles.js — Floating GDG Photos instead of simple particles
import * as THREE from 'three';
import { GOOGLE_COLORS_ARRAY, PHOTO_URLS } from './events.js';

// Floating Photo Sprites along the path
const sharedCanvas = document.createElement('canvas');
const sharedCtx = sharedCanvas.getContext('2d', { willReadFrequently: true });

export function createParticles(totalLength) {
  const group = new THREE.Group();
  
  // Use all available photos!
  const count = PHOTO_URLS.length;
  const shuffled = [...PHOTO_URLS].sort(() => 0.5 - Math.random());
  
  const initialPositions = [];

  for (let i = 0; i < count; i++) {
    const url = shuffled[i];
    
    // Distribute evenly along the Z axis
    const zSpacing = totalLength / count;
    const z = -80 - (i * zSpacing) - (Math.random() * zSpacing * 0.5);
    
    // MASSIVE SPREAD to prevent 150 images from overlapping into a wall
    const x = (Math.random() - 0.5) * 300; // Spread horizontally (-150 to 150)
    const y = (Math.random() - 0.5) * 160; // Spread vertically (-80 to 80)

    initialPositions.push({ x, y, z, phase: Math.random() * Math.PI * 2 });

    // Load and downscale asynchronously, STAGGERED to prevent network bottleneck
    setTimeout(() => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = url;
      img.onload = () => {
        const MAX_SIZE = 512; // Increased for better quality without crashing
        let w = img.width;
        let h = img.height;
        if (w > MAX_SIZE || h > MAX_SIZE) {
          const ratio = Math.min(MAX_SIZE / w, MAX_SIZE / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        
        sharedCanvas.width = w;
        sharedCanvas.height = h;
        sharedCtx.clearRect(0, 0, w, h);
        
        // Flip vertically before drawing to fix upside-down DataTexture
        sharedCtx.save();
        sharedCtx.translate(0, h);
        sharedCtx.scale(1, -1);
        sharedCtx.drawImage(img, 0, 0, w, h);
        sharedCtx.restore();
        
        const imageData = sharedCtx.getImageData(0, 0, w, h);
        const tex = new THREE.DataTexture(imageData.data, w, h, THREE.RGBAFormat);
        tex.colorSpace = THREE.SRGBColorSpace;
        
        // Fix blocky/pixelated appearance
        tex.magFilter = THREE.LinearFilter;
        tex.minFilter = THREE.LinearFilter; // Use LinearFilter instead of Mipmap to ensure compatibility with non-power-of-2 dimensions
        tex.generateMipmaps = false; 
        
        tex.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
          map: tex,
          color: 0xffffff,
          transparent: true,
          opacity: 0 // Will fade in during update
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.position.set(x, y, z);
        
        // SMALL SIZE so they don't block the screen
        const scaleFactor = Math.random() * 5 + 7; // Range: 7 to 12
        const aspectRatio = w / h || 1.5;
        sprite.scale.set(scaleFactor * aspectRatio, scaleFactor, 1);
        
        sprite.userData.index = i;
        group.add(sprite);
      };
    }, i * 50); // 50ms delay between each image request (total ~7.5s for 150 images)
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
export function updateParticles(particleGroup, time, scrollProgress = 1, camera = null) {
  const initial = particleGroup.userData.initialPositions;
  if (!initial) return;

  // Fade in at the beginning (0.01 to 0.05)
  const fadeIn = Math.max(0, Math.min(1, (scrollProgress - 0.01) * 25));
  // Fade out at the end (0.90 to 0.94) so they don't overlap the final birthday message
  const fadeOut = Math.max(0, Math.min(1, (0.94 - scrollProgress) * 25));
  
  const targetOpacity = fadeIn * fadeOut * 0.85;

  // Completely hide them from the DOM rendering if opacity is 0 to save performance
  particleGroup.visible = targetOpacity > 0;

  if (targetOpacity > 0) {
    const camZ = camera ? camera.position.z : 0;
    
    particleGroup.children.forEach((sprite) => {
      const idx = sprite.userData.index;
      if (idx === undefined) return;
      const data = initial[idx];
      
      // Frustum culling: Only render images that are near the camera
      if (camera) {
        if (data.z > camZ + 30 || data.z < camZ - 150) {
          sprite.visible = false;
          return; // Skip math updates
        } else {
          sprite.visible = true;
        }
      }

      // Gentle floating effect for photos
      sprite.position.x = data.x + Math.sin(time * 0.2 + data.phase) * 3;
      sprite.position.y = data.y + Math.sin(time * 0.3 + data.phase * 2) * 2;
      
      // Update opacity
      sprite.material.opacity = targetOpacity;
    });
  }
}

