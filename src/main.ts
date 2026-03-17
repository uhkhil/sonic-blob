import './style.css'
import { startAudioCapture } from './audio';

import * as THREE from 'three';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div id="canvas-container" class="absolute inset-0 z-0 w-full h-full"></div>
  
  <!-- Overlay wrapper -->
  <div class="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end items-start p-5 gap-3">
    
    <!-- Control Panel Menu -->
    <div id="controls-panel" class="pointer-events-auto bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-6 w-[320px] text-white flex-col gap-5 transform translate-y-4 opacity-0 hidden transition-all duration-300 origin-bottom-left">
      
      <div class="flex justify-between items-center pb-2 border-b border-white/10">
        <h3 class="font-semibold text-lg">Appearance Config</h3>
        <button id="close-controls" class="text-white/50 hover:text-white cursor-pointer transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>
      </div>

      <div class="flex flex-col gap-4 mt-4">
        <!-- Polygon Detail -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
            <label for="ctrl-detail">Polygon Detail</label>
            <span id="val-detail">32</span>
          </div>
          <input type="range" id="ctrl-detail" min="4" max="128" step="4" value="32" class="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer" title="Higher = smoother but higher CPU usage">
        </div>

        <!-- Base Radius -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
            <label for="ctrl-radius">Base Size</label>
            <span id="val-radius">1.00</span>
          </div>
          <input type="range" id="ctrl-radius" min="0.5" max="2.0" step="0.05" value="1.0" class="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Rotation Speed -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
            <label for="ctrl-rotationspeed">Rotation Speed</label>
            <span id="val-rotationspeed">1.0</span>
          </div>
          <input type="range" id="ctrl-rotationspeed" min="0.0" max="5.0" step="0.1" value="1.0" class="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Colors Menu Frame -->
        <div class="flex flex-col gap-2 mt-2 pt-4 border-t border-white/10">
          <div class="text-xs font-semibold text-white/50 uppercase tracking-widest mb-1">Color Palette</div>
          
          <!-- Blob Colors -->
          <div class="flex justify-between items-center text-sm font-medium text-white/90">
            <label>Blob Lighting</label>
            <div class="flex gap-2">
              <input type="color" id="ctrl-primary" value="#ff00ff" title="Primary Color" class="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform">
              <input type="color" id="ctrl-accent" value="#00ffff" title="Accent Color" class="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform">
            </div>
          </div>

          <!-- Background Color -->
          <div class="flex justify-between items-center text-sm font-medium text-white/90">
            <label for="ctrl-bgcolor">Background</label>
            <input type="color" id="ctrl-bgcolor" value="#73b2c1" class="w-8 h-8 rounded cursor-pointer border-0 shadow-inner bg-transparent p-0 transform hover:scale-110 transition-transform">
          </div>
        </div>

        <!-- Noise Amplitude -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
            <label for="ctrl-noiseamp">Ripple Depth</label>
            <span id="val-noiseamp">0.50</span>
          </div>
          <input type="range" id="ctrl-noiseamp" min="0.1" max="1.5" step="0.05" value="0.5" class="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>

        <!-- Sensitivity -->
        <div class="flex flex-col gap-1.5">
          <div class="flex justify-between text-xs font-medium text-white/70 uppercase tracking-wider">
            <label for="ctrl-sensitivity">Sensitivity</label>
            <span id="val-sensitivity">1.0</span>
          </div>
          <input type="range" id="ctrl-sensitivity" min="0.1" max="3.0" step="0.1" value="1.0" class="w-full accent-[#73b2c1] bg-white/20 h-1.5 rounded-lg appearance-none cursor-pointer">
        </div>
      </div>

      <div class="flex gap-3 mt-5">
        <button id="reset-config" class="w-full bg-white/10 text-white cursor-pointer font-semibold py-2.5 rounded-xl hover:bg-white/20 transition-colors flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><path d="M3 3v5h5"></path></svg>
          Reset Config
        </button>
        <button id="copy-config" class="w-full bg-white text-black cursor-pointer font-semibold py-2.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
          Copy Config
        </button>
      </div>

    </div>

    <!-- Controls Button -->
    <button id="toggle-controls" class="pointer-events-auto cursor-pointer self-start bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full px-4 py-2 text-sm font-medium transition-all duration-500 focus:outline-none">
      <span class="flex items-center gap-2">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>
        Controls
      </span>
    </button>
  </div>

  <!-- Fullscreen Button (bottom-right) -->
  <button id="btn-fullscreen" class="absolute z-10 bottom-5 right-5 pointer-events-auto cursor-pointer bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white rounded-full p-2.5 transition-all duration-500 focus:outline-none" title="Toggle Fullscreen (F)">
    <svg id="icon-expand" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 3H5a2 2 0 0 0-2 2v3"/><path d="M21 8V5a2 2 0 0 0-2-2h-3"/><path d="M3 16v3a2 2 0 0 0 2 2h3"/><path d="M16 21h3a2 2 0 0 0 2-2v-3"/></svg>
    <svg id="icon-compress" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="hidden"><path d="M8 3v3a2 2 0 0 1-2 2H3"/><path d="M21 8h-3a2 2 0 0 1-2-2V3"/><path d="M3 16h3a2 2 0 0 1 2 2v3"/><path d="M16 21v-3a2 2 0 0 1 2-2h3"/></svg>
  </button>
`

// --- UI Interaction Logic ---
const btnToggle = document.getElementById('toggle-controls')!;
const btnClose = document.getElementById('close-controls')!;
const panel = document.getElementById('controls-panel')!;

function openControls() {
  panel.classList.remove('hidden');
  // Small delay to allow display block to process before transition
  requestAnimationFrame(() => {
    panel.classList.remove('opacity-0', 'translate-y-4');
    panel.classList.add('flex', 'opacity-100', 'translate-y-0');
  });
}

function closeControls() {
  panel.classList.remove('opacity-100', 'translate-y-0');
  panel.classList.add('opacity-0', 'translate-y-4');
  setTimeout(() => {
    panel.classList.add('hidden');
    panel.classList.remove('flex');
  }, 300); // match duration-300
}

btnToggle.addEventListener('click', (e) => {
  e.stopPropagation();
  panel.classList.contains('hidden') ? openControls() : closeControls();
});
btnClose.addEventListener('click', closeControls);

// Close on Escape key / toggle fullscreen with F
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !panel.classList.contains('hidden')) {
    closeControls();
  }
  if (e.key === 'f' || e.key === 'F') {
    toggleFullscreen();
  }
});

// Close on outside click
document.addEventListener('click', (e) => {
  if (!panel.classList.contains('hidden') &&
      !panel.contains(e.target as Node) &&
      !btnToggle.contains(e.target as Node)) {
    closeControls();
  }
});

// --- Fullscreen Logic ---
const btnFullscreen = document.getElementById('btn-fullscreen')!;
const iconExpand = document.getElementById('icon-expand')!;
const iconCompress = document.getElementById('icon-compress')!;

function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    document.exitFullscreen();
  }
}

btnFullscreen.addEventListener('click', toggleFullscreen);

document.addEventListener('fullscreenchange', () => {
  const isFs = !!document.fullscreenElement;
  iconExpand.classList.toggle('hidden', isFs);
  iconCompress.classList.toggle('hidden', !isFs);
});

// --- Auto-hide UI on cursor inactivity ---
const uiElements = [btnToggle, btnFullscreen];
let idleTimer: ReturnType<typeof setTimeout>;

function showUI() {
  document.body.style.cursor = 'default';
  uiElements.forEach(el => {
    el.style.opacity = '1';
    el.style.pointerEvents = '';
  });
}

function hideUI() {
  // Keep controls button visible if panel is open
  if (panel.classList.contains('hidden')) {
    document.body.style.cursor = 'none';
  }
  uiElements.forEach(el => {
    el.style.opacity = '0';
    el.style.pointerEvents = 'none';
  });
}

document.addEventListener('mousemove', () => {
  showUI();
  clearTimeout(idleTimer);
  idleTimer = setTimeout(hideUI, 2500);
});

// Start the idle timer immediately
idleTimer = setTimeout(hideUI, 2500);



// --- Config State Object ---
const DEFAULT_CONFIG = {
  detail: 32,
  baseRadius: 1.0,
  rippleDepth: 0.5,
  sensitivity: 1.0,
  rotationSpeed: 1.0,
  primaryColor: '#ff00ff',
  accentColor: '#00ffff',
  bgColor: '#73b2c1'
};

const savedConfig = localStorage.getItem('sonic_blob_config');
export const config = savedConfig ? { ...DEFAULT_CONFIG, ...JSON.parse(savedConfig) } : { ...DEFAULT_CONFIG };

function saveConfig() {
  localStorage.setItem('sonic_blob_config', JSON.stringify(config));
}

// Wire up inputs
const setupSlider = (id: string, prop: 'detail' | 'baseRadius' | 'rippleDepth' | 'rotationSpeed' | 'sensitivity', isInt: boolean = false) => {
  const input = document.getElementById(`ctrl-${id}`) as HTMLInputElement;
  const label = document.getElementById(`val-${id}`)!;
  
  input.addEventListener('input', (e) => {
    const val = parseFloat((e.target as HTMLInputElement).value);
    config[prop] = isInt ? Math.round(val) : val;
    label.textContent = isInt ? Math.round(val).toString() : val.toFixed(2);
    
    // Geometry needs to be completely re-created if detail changes
    if (prop === 'detail') {
      recreateGeometry(config.detail);
    }
    saveConfig();
  });
};

setupSlider('detail', 'detail', true);
setupSlider('radius', 'baseRadius');
setupSlider('rotationspeed', 'rotationSpeed');
setupSlider('noiseamp', 'rippleDepth');
setupSlider('sensitivity', 'sensitivity');

// Color inputs

const bgColorInput = document.getElementById('ctrl-bgcolor') as HTMLInputElement;
bgColorInput.addEventListener('input', (e) => {
  config.bgColor = (e.target as HTMLInputElement).value;
  scene.background = new THREE.Color(config.bgColor);
  document.body.style.backgroundColor = config.bgColor; // Ensure the body matches behind pure canvas rendering 
  saveConfig();
});

// Copy button
const copyBtn = document.getElementById('copy-config')!;
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(JSON.stringify(config, null, 2))
    .then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg> Copied!`;
      setTimeout(() => { copyBtn.innerHTML = originalText; }, 2000);
    });
});


// 1. Set up Three.js Scene
const scene = new THREE.Scene();
scene.background = new THREE.Color(config.bgColor);
document.body.style.backgroundColor = config.bgColor;
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // optimize performance
document.getElementById('canvas-container')!.appendChild(renderer.domElement);

// 2. Add Lighting for iridescent look
const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
scene.add(ambientLight);

// Primary colored light from bottom left
const light1 = new THREE.DirectionalLight(config.primaryColor, 2.0);
light1.position.set(-5, -5, 5);
scene.add(light1);

// Accent colored light from top right
const light2 = new THREE.DirectionalLight(config.accentColor, 2.0);
light2.position.set(5, 5, 5);
scene.add(light2);

const primaryInput = document.getElementById('ctrl-primary') as HTMLInputElement;
primaryInput.addEventListener('input', (e) => {
  config.primaryColor = (e.target as HTMLInputElement).value;
  light1.color.set(config.primaryColor);
  saveConfig();
});

const accentInput = document.getElementById('ctrl-accent') as HTMLInputElement;
accentInput.addEventListener('input', (e) => {
  config.accentColor = (e.target as HTMLInputElement).value;
  light2.color.set(config.accentColor);
  saveConfig();
});

// White fill light
const light3 = new THREE.DirectionalLight(0xffffff, 1.0);
light3.position.set(0, 0, 5);
scene.add(light3);

// 3. Create the Blob
// Icosahedron with adjustable detail. We keep track of geometry, material, and mesh so we can update them.
let geometry = new THREE.IcosahedronGeometry(1.2, config.detail); 
const material = new THREE.MeshPhysicalMaterial({
  color: 0xffffff,
  metalness: 0.1,
  roughness: 0.1,
  clearcoat: 1.0,
  clearcoatRoughness: 0.1,
  iridescence: 1.0,
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
let positionAttribute = geometry.getAttribute('position');
let originalPositions: number[] = [];

// Function to extract base vertex positions for deformation loop
function extractOriginalPositions() {
  positionAttribute = geometry.getAttribute('position');
  originalPositions = [];
  for (let i = 0; i < positionAttribute.count; i++) {
    originalPositions.push(
      positionAttribute.getX(i),
      positionAttribute.getY(i),
      positionAttribute.getZ(i)
    );
  }
}

extractOriginalPositions();

// Function to re-create the geometry when the detail slider is changed
function recreateGeometry(detail: number) {
  geometry.dispose(); // clean up old geometry memory
  geometry = new THREE.IcosahedronGeometry(1.2, detail);
  blob.geometry = geometry;
  extractOriginalPositions();
}

// --- Persistence Init & Reset Logic ---
function updateUIFromConfig() {
  (document.getElementById('ctrl-detail') as HTMLInputElement).value = config.detail.toString();
  document.getElementById('val-detail')!.textContent = config.detail.toString();
  
  (document.getElementById('ctrl-radius') as HTMLInputElement).value = config.baseRadius.toString();
  document.getElementById('val-radius')!.textContent = config.baseRadius.toFixed(2);

  (document.getElementById('ctrl-rotationspeed') as HTMLInputElement).value = config.rotationSpeed.toString();
  document.getElementById('val-rotationspeed')!.textContent = config.rotationSpeed.toFixed(1);
  
  (document.getElementById('ctrl-noiseamp') as HTMLInputElement).value = config.rippleDepth.toString();
  document.getElementById('val-noiseamp')!.textContent = config.rippleDepth.toFixed(2);

  (document.getElementById('ctrl-sensitivity') as HTMLInputElement).value = config.sensitivity.toString();
  document.getElementById('val-sensitivity')!.textContent = config.sensitivity.toFixed(1);
  
  (document.getElementById('ctrl-primary') as HTMLInputElement).value = config.primaryColor;
  (document.getElementById('ctrl-accent') as HTMLInputElement).value = config.accentColor;
  (document.getElementById('ctrl-bgcolor') as HTMLInputElement).value = config.bgColor;
  
  // Update Scene strictly from Config explicitly
  light1.color.set(config.primaryColor);
  light2.color.set(config.accentColor);
  scene.background = new THREE.Color(config.bgColor);
  document.body.style.backgroundColor = config.bgColor;
}

updateUIFromConfig(); // Runs on load to match any persistence

const resetBtn = document.getElementById('reset-config')!;
resetBtn.addEventListener('click', () => {
  Object.assign(config, DEFAULT_CONFIG);
  saveConfig();
  recreateGeometry(config.detail);
  updateUIFromConfig();
});

import { createNoise3D } from 'simplex-noise';
const noise3D = createNoise3D();

// 4. Audio Integration
let audioData: Uint8Array | null = null;
let smoothedVolume = 0; 
let smoothedBass = 0;
let smoothedTreble = 0;

async function initVisualizer() {
  try {
    await startAudioCapture((data: Uint8Array) => {
      audioData = data;
    });
  } catch (err: any) {
    console.error(err);
  }
}

// 5. Animation Loop
let time = 0;

function animate() {
  requestAnimationFrame(animate);

  // Apply rotation multiplier
  blob.rotation.x += 0.002 * config.rotationSpeed;
  blob.rotation.y += 0.003 * config.rotationSpeed;

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

  // Smooth the audio transitions with asymmetric attack/release:
  // Fast attack (0.15) to react quickly to sound, slow release (0.03) to fade out gracefully.
  const attack = 0.15;
  const release = 0.03;
  smoothedVolume += (currentVolume - smoothedVolume) * (currentVolume > smoothedVolume ? attack : release);
  smoothedBass   += (currentBass   - smoothedBass)   * (currentBass   > smoothedBass   ? attack : release);
  smoothedTreble += (currentTreble - smoothedTreble) * (currentTreble > smoothedTreble ? attack : release);

  // Add extra speed to time when music is playing (groove)
  time += smoothedVolume * 0.02;

  const positionAttribute = geometry.getAttribute('position');

  // Treble makes the ripples tighter (higher frequency noise)
  const noiseFreq = 0.8 + (smoothedTreble * 0.8);
  
  // noiseAmp fades naturally with smoothedVolume (no hard threshold).
  // Coefficients are boosted to compensate for the smoothedVolume multiplier (which sits ~0.1–0.3),
  // ensuring the blob deforms as energetically as before while still fading gracefully on silence.
  const noiseAmp = smoothedVolume * config.sensitivity * (0.4 + smoothedBass * 2.5);

  // We re-declare vertex inside loop or just reuse one
  const vertex = new THREE.Vector3();

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
    const baseRadius = config.baseRadius + (smoothedVolume * 0.1); 
    
    const scale = baseRadius + noiseVal * noiseAmp * config.rippleDepth;

    vertex.copy(direction).multiplyScalar(scale);

    positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
  }
  
  positionAttribute.needsUpdate = true;
  geometry.computeVertexNormals(); // Recompute lighting normals so it shades smoothly
  
  renderer.render(scene, camera);
}

initVisualizer();
animate();
