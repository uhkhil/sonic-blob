import './style.css'
import { startAudioCapture } from './audio';

import * as THREE from 'three';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="canvas-container"></div>
  <div class="overlay">
    <div id="data-log" class="data-log">Awaiting audio...</div>
  </div>
`

// 1. Set up Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color('#73b2c1'); // Light teal background matching reference
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // optimize performance
document.getElementById('canvas-container')!.appendChild(renderer.domElement);

// 2. Add Lighting for iridescent look
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

// Magenta light from bottom left
const light1 = new THREE.DirectionalLight(0xff00ff, 2.0);
light1.position.set(-5, -5, 5);
scene.add(light1);

// Cyan light from top right
const light2 = new THREE.DirectionalLight(0x00ffff, 2.0);
light2.position.set(5, 5, 5);
scene.add(light2);

// White fill light
const light3 = new THREE.DirectionalLight(0xffffff, 1.0);
light3.position.set(0, 0, 5);
scene.add(light3);

// 3. Create the Blob
// Icosahedron with detail = 32 generates ~10,000 vertices which is smooth enough for lighting
// but exponentially faster to loop through on the CPU compared to 128 (~160,000 vertices)
const geometry = new THREE.IcosahedronGeometry(1.2, 32); 
const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,          // Base color white so iridescence shows through
  metalness: 0.1,
  roughness: 0.1,           // Very smooth
  clearcoat: 1.0,           // Glossy clearcoat layer
  clearcoatRoughness: 0.1,
  iridescence: 1.0,         // Oil-slick / pearl effect
  iridescenceIOR: 1.5,
  iridescenceThicknessRange: [100, 400]
});

const blob = new THREE.Mesh(geometry, material);
scene.add(blob);

camera.position.z = 5;

// Handle window resizing
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// We need a place to store original vertex positions so we can deform *relative* to them.
const positionAttribute = geometry.getAttribute('position');
const vertex = new THREE.Vector3();
const originalPositions: number[] = [];
for (let i = 0; i < positionAttribute.count; i++) {
  originalPositions.push(
    positionAttribute.getX(i),
    positionAttribute.getY(i),
    positionAttribute.getZ(i)
  );
}

import { createNoise3D } from 'simplex-noise';
const noise3D = createNoise3D();

// 4. Audio Integration
const dataLog = document.querySelector<HTMLDivElement>('#data-log')!;
let audioData: Uint8Array | null = null;
let smoothedVolume = 0; 
let smoothedBass = 0;
let smoothedTreble = 0;

async function initVisualizer() {
  try {
    await startAudioCapture((data: Uint8Array) => {
      audioData = data;
      const avg = data.reduce((a, b) => a + b, 0) / data.length;
      dataLog.textContent = avg > 5 ? `Playing (Signal: ${avg.toFixed(1)})` : 'Silent';
    });
  } catch (err: any) {
    console.error(err);
    dataLog.textContent = `Error: ${err.message || err.toString()}`;
  }
}

// 5. Animation Loop
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  // Always rotate slowly
  blob.rotation.x += 0.002;
  blob.rotation.y += 0.003;

  time += 0.008; // Base time speed

  let currentVolume = 0;
  let currentBass = 0;
  let currentTreble = 0;

  if (audioData) {
    const avgVolume = audioData.reduce((a, b) => a + b, 0) / audioData.length;
    currentVolume = avgVolume / 255.0;

    // Isolate bass (lows) and treble (highs)
    currentBass = audioData.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255.0;
    currentTreble = audioData.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255.0;
  }

  // Smooth the audio transitions so the blob doesn't snap instantly
  smoothedVolume += (currentVolume - smoothedVolume) * 0.15;
  smoothedBass += (currentBass - smoothedBass) * 0.15;
  smoothedTreble += (currentTreble - smoothedTreble) * 0.15;

  // Add extra speed to time when music is playing (groove)
  time += smoothedVolume * 0.02;

  const positionAttribute = geometry.getAttribute('position');

  // Treble makes the ripples tighter (higher frequency noise)
  const noiseFreq = 0.8 + (smoothedTreble * 0.8);
  // Bass makes the ripples deeper (higher amplitude noise)
  const noiseAmp = 0.2 + (smoothedBass * 0.4);

  for (let i = 0; i < positionAttribute.count; i++) {
    const ix = i * 3;
    vertex.set(
        originalPositions[ix],
        originalPositions[ix + 1],
        originalPositions[ix + 2]
    );

    const direction = vertex.clone().normalize();
    
    // Sample global 3D noise for this vertex. 
    // Since neighbors share the exact same original coordinates, they will sample identical noise values.
    // This maintains a 100% continuous surface without spikes!
    let noiseVal = noise3D(
        vertex.x * noiseFreq + time, 
        vertex.y * noiseFreq + time, 
        vertex.z * noiseFreq + time
    );

    // Inflate slightly on volume
    const baseRadius = 1.0 + (smoothedVolume * 0.1); 
    
    const scale = baseRadius + noiseVal * noiseAmp;

    vertex.copy(direction).multiplyScalar(scale);

    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals(); // Recompute lighting normals so it shades smoothly
  
  renderer.render(scene, camera);
}

initVisualizer();
animate();
