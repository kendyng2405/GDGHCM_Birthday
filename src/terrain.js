// terrain.js — 3D Procedural Mountain Canyon for GDG HCMC Timeline
import * as THREE from 'three';
import { noise2D, fbm } from './noise.js';

const GOOGLE_COLORS = {
  blue:   new THREE.Color(0x4285F4),
  red:    new THREE.Color(0xEA4335),
  yellow: new THREE.Color(0xFBBC04),
  green:  new THREE.Color(0x34A853),
};

const COLOR_BANDS = [
  { h: 0.0, color: new THREE.Color(0x0d0d2b) },   // Valley floor — deep dark
  { h: 0.15, color: new THREE.Color(0x151540) },   // Low slopes
  { h: 0.3, color: new THREE.Color(0x1a3a6e) },    // Mid — blue tint
  { h: 0.5, color: new THREE.Color(0x4285F4) },    // Google blue
  { h: 0.65, color: new THREE.Color(0x34A853) },   // Google green
  { h: 0.8, color: new THREE.Color(0xEA4335) },    // Google red peaks
  { h: 0.9, color: new THREE.Color(0xFBBC04) },    // Google yellow tips
  { h: 1.0, color: new THREE.Color(0xffffff) },    // Snow caps
];

function getTerrainColor(normalizedHeight) {
  for (let i = 1; i < COLOR_BANDS.length; i++) {
    if (normalizedHeight <= COLOR_BANDS[i].h) {
      const prev = COLOR_BANDS[i - 1];
      const curr = COLOR_BANDS[i];
      const t = (normalizedHeight - prev.h) / (curr.h - prev.h);
      return new THREE.Color().lerpColors(prev.color, curr.color, t);
    }
  }
  return COLOR_BANDS[COLOR_BANDS.length - 1].color.clone();
}

export function createTerrain(totalLength) {
  const width = 200;
  const length = totalLength;
  const widthSeg = 100;
  const lengthSeg = Math.floor(length / 3);

  const geometry = new THREE.PlaneGeometry(width, length, widthSeg, lengthSeg);
  geometry.rotateX(-Math.PI / 2);

  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 3);
  let maxH = 0;

  // First pass: compute heights
  const heights = new Float32Array(positions.count);
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    // Canyon shape: mountains on sides, flat center
    const distFromCenter = Math.abs(x) / (width / 2);
    const canyonFactor = Math.pow(Math.max(0, distFromCenter - 0.12), 1.8);

    // Multi-octave terrain noise
    let h = 0;
    h += fbm(x * 0.008, z * 0.008, 4) * 50;
    h += noise2D(x * 0.02, z * 0.015) * 20;
    h += noise2D(x * 0.06, z * 0.04) * 8;

    // Apply canyon shape
    h = Math.max(0, h) * canyonFactor;

    // Flatten the center path
    if (Math.abs(x) < 12) {
      h *= smoothstep(0, 12, Math.abs(x));
      h = Math.max(h, -0.5);
    }

    heights[i] = h;
    if (h > maxH) maxH = h;
  }

  // Second pass: set positions and colors
  for (let i = 0; i < positions.count; i++) {
    const h = heights[i];
    positions.setY(i, h);

    const nh = Math.max(0, h) / (maxH || 1);
    const color = getTerrainColor(nh);
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;
  }

  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 0.85,
    metalness: 0.05,
    flatShading: true,
    side: THREE.DoubleSide,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.receiveShadow = true;
  return mesh;
}

// Create glowing event markers along the path
export function createEventMarkers(events, totalLength) {
  const group = new THREE.Group();
  const spacing = totalLength / events.length;

  events.forEach((event, i) => {
    const z = -(i * spacing + spacing / 2);
    const color = new THREE.Color(event.color);

    // Glowing sphere
    const sphereGeo = new THREE.SphereGeometry(1.2, 16, 16);
    const sphereMat = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 0.8,
      transparent: true,
      opacity: 0.7,
    });
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);
    sphere.position.set(0, 3, z);
    group.add(sphere);

    // Point light at marker
    const light = new THREE.PointLight(color, 15, 50, 2);
    light.position.set(0, 5, z);
    group.add(light);

    // Vertical beam
    const beamGeo = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
    const beamMat = new THREE.MeshBasicMaterial({
      color: color,
      transparent: true,
      opacity: 0.15,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);
    beam.position.set(0, 3, z);
    group.add(beam);
  });

  return group;
}

function smoothstep(edge0, edge1, x) {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}
