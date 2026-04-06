/**
 * @file Core 3D engine class encapsulating Three.js rendering and animation loop.
 */
import * as THREE from 'three';
import { createBlobMaterial, blobShaderUniforms } from './BlobMaterial';
import { analyzeFrequencyData } from '../audio';
import type { Config } from '../themes';

/**
 * BlobRenderer
 * A dedicated class to handle all Three.js imperative logic.
 * This separates the 3D graphics engine from the React UI components,
 * making the code much easier to read and maintain.
 */
export class BlobRenderer {
  private container: HTMLElement;
  private config: Config;

  // React Event Callbacks
  public onAudio?: () => void;
  public onSilence?: () => void;

  // Audio State
  public audioData: Uint8Array | null = null;
  private smoothedVolume = 0;
  private smoothedBass = 0;
  private smoothedTreble = 0;
  private hasAudio = false;
  private silenceTimer = 0;

  // Three.js Core Objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private geometry: THREE.IcosahedronGeometry;
  private material: THREE.MeshPhysicalMaterial;
  private blob: THREE.Mesh;

  // Lighting
  private light1: THREE.DirectionalLight;
  private light2: THREE.DirectionalLight;
  private light3: THREE.DirectionalLight;

  // Animation State
  private animationId: number = 0;
  private time: number = 0;

  constructor(container: HTMLElement, initialConfig: Config) {
    this.container = container;
    this.config = initialConfig;

    // 1. Setup Scene & Background
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.config.bgColor);
    document.body.style.backgroundColor = this.config.bgColor;

    // 2. Setup Camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    this.camera.position.z = 5;

    // 3. Setup WebGL Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    this.container.appendChild(this.renderer.domElement);

    // 4. Setup Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    this.scene.add(ambientLight);

    this.light1 = new THREE.DirectionalLight(this.config.primaryColor, 8.0);
    this.light1.position.set(-5, 5, 5);
    this.scene.add(this.light1);

    this.light2 = new THREE.DirectionalLight(this.config.accentColor, 3.0);
    this.light2.position.set(5, 5, 5);
    this.scene.add(this.light2);

    this.light3 = new THREE.DirectionalLight(0xffffff, 0.3);
    this.light3.position.set(0, -5, 5); // Fill light
    this.scene.add(this.light3);

    // 5. Setup Mesh (Geometry + Material)
    this.geometry = new THREE.IcosahedronGeometry(1.2, this.config.detail);
    this.material = createBlobMaterial();
    this.material.transparent = true; // Required for transmission
    this.material.transmission = 1.0 - this.config.opacity;
    this.material.opacity = 1.0; // Keep solid so transmission calculates physically based volume
    this.material.thickness = 1.5; // Simulate volumetric thickness for refraction effect
    this.material.roughness = this.config.roughness;
    this.material.clearcoatRoughness = this.config.roughness;
    this.blob = new THREE.Mesh(this.geometry, this.material);
    this.scene.add(this.blob);

    // 6. Bind Event Listeners
    this.handleResize = this.handleResize.bind(this);
    window.addEventListener('resize', this.handleResize);

    // 7. Start Render Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  /**
   * Updates only the visual elements that have changed when the theme is swapped.
   * This is much more efficient than destroying and recreating the whole scene.
   */
  public updateConfig(newConfig: Config) {
    if (newConfig.detail !== this.config.detail) {
      this.recreateGeometry(newConfig.detail);
    }
    if (newConfig.bgColor !== this.config.bgColor) {
      this.scene.background = new THREE.Color(newConfig.bgColor);
      document.body.style.backgroundColor = newConfig.bgColor;
    }
    if (newConfig.primaryColor !== this.config.primaryColor) {
      this.light1.color.set(newConfig.primaryColor);
    }
    if (newConfig.accentColor !== this.config.accentColor) {
      this.light2.color.set(newConfig.accentColor);
    }
    if (newConfig.roughness !== this.config.roughness) {
      this.material.roughness = newConfig.roughness;
      this.material.clearcoatRoughness = newConfig.roughness;
    }
    if (newConfig.opacity !== this.config.opacity) {
      this.material.transmission = 1.0 - newConfig.opacity;
    }
    this.config = newConfig;
  }

  /**
   * Disposes of WebGL memory to prevent memory leaks when the component unmounts.
   */
  public dispose() {
    cancelAnimationFrame(this.animationId);
    window.removeEventListener('resize', this.handleResize);

    this.geometry.dispose();
    this.material.dispose();
    this.renderer.dispose();

    if (
      this.container &&
      this.renderer.domElement.parentNode === this.container
    ) {
      this.container.removeChild(this.renderer.domElement);
    }
  }

  private recreateGeometry(detail: number) {
    this.geometry.dispose();
    this.geometry = new THREE.IcosahedronGeometry(1.2, detail);
    this.blob.geometry = this.geometry;
  }

  private handleResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  /**
   * The main render loop. This runs 60 times per second to animate the blob.
   */
  private animate() {
    this.animationId = requestAnimationFrame(this.animate);

    // 1. Base Rotation
    this.blob.rotation.x += 0.002 * this.config.rotationSpeed;
    this.blob.rotation.y += 0.003 * this.config.rotationSpeed;
    this.time += 0.008;

    // 2. Audio Analysis
    const { currentVolume, currentBass, currentTreble } = analyzeFrequencyData(
      this.audioData,
      this.config.audioSamples,
    );

    // 3. Audio UI Event Triggers
    if (currentVolume > 0) {
      if (!this.hasAudio && this.onAudio) {
        this.hasAudio = true;
        this.onAudio();
      }
    } else if (!this.hasAudio) {
      this.silenceTimer += 0.016;
      if (this.silenceTimer > 1.0 && this.onSilence) {
        this.onSilence();
        this.silenceTimer = -9999; // Only trigger once
      }
    }

    // 4. Smooth the Audio Reactive Values over time so the blob doesn't jitter
    const attack = 0.15;
    const release = 0.03;

    this.smoothedVolume +=
      (currentVolume - this.smoothedVolume) *
      (currentVolume > this.smoothedVolume ? attack : release);
    this.smoothedBass +=
      (currentBass - this.smoothedBass) *
      (currentBass > this.smoothedBass ? attack : release);
    this.smoothedTreble +=
      (currentTreble - this.smoothedTreble) *
      (currentTreble > this.smoothedTreble ? attack : release);

    this.time += this.smoothedVolume * 0.02;

    // 5. Calculate Shader Displacements based on Audio
    let noiseFreq, noiseAmp;

    // Control whether to use the 'global' smoother waves or 'individual' spiky waves
    if (this.config.moveTogether) {
      noiseFreq = 0.2 + this.smoothedTreble * 0.4;
      noiseAmp =
        this.smoothedVolume *
        this.config.sensitivity *
        (0.5 + this.smoothedBass * 1.5);
    } else {
      noiseFreq = 0.8 + this.smoothedTreble * 0.8;
      noiseAmp =
        this.smoothedVolume *
        this.config.sensitivity *
        (0.4 + this.smoothedBass * 2.5);
    }

    const baseRadius = this.config.baseRadius + this.smoothedVolume * 0.1;

    // 6. Send the latest variables to the GPU via Uniforms
    blobShaderUniforms.uTime.value = this.time;
    blobShaderUniforms.uNoiseFreq.value = noiseFreq;
    blobShaderUniforms.uNoiseAmp.value = noiseAmp;
    blobShaderUniforms.uBaseRadius.value = baseRadius;
    blobShaderUniforms.uRippleDepth.value = this.config.rippleDepth;

    // 7. Render Screen
    this.renderer.render(this.scene, this.camera);
  }
}
