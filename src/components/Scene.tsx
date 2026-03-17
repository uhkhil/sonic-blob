import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { createNoise3D } from 'simplex-noise';
import { store } from '../store';
import { startAudioCapture } from '../audio';

const noise3D = createNoise3D();

export const Scene: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // --- State & Refs ---
    let config = store.config;
    let audioData: Uint8Array | null = null;
    let smoothedVolume = 0; 
    let smoothedBass = 0;
    let smoothedTreble = 0;
    let animationId: number;
    let time = 0;

    // --- Three.js Setup ---
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(config.bgColor);
    document.body.style.backgroundColor = config.bgColor;
    
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    containerRef.current.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(config.primaryColor, 2.0);
    light1.position.set(-5, -5, 5);
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(config.accentColor, 2.0);
    light2.position.set(5, 5, 5);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 1.0);
    light3.position.set(0, 0, 5);
    scene.add(light3);

    // --- Geometry & Material ---
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

    // Geometry Helpers
    let positionAttribute = geometry.getAttribute('position');
    let originalPositions = new Float32Array(positionAttribute.count * 3);

    const extractOriginalPositions = () => {
      positionAttribute = geometry.getAttribute('position');
      if (originalPositions.length !== positionAttribute.count * 3) {
        originalPositions = new Float32Array(positionAttribute.count * 3);
      }
      for (let i = 0; i < positionAttribute.count; i++) {
        originalPositions[i * 3]     = positionAttribute.getX(i);
        originalPositions[i * 3 + 1] = positionAttribute.getY(i);
        originalPositions[i * 3 + 2] = positionAttribute.getZ(i);
      }
    };
    extractOriginalPositions();

    const recreateGeometry = (detail: number) => {
      geometry.dispose();
      geometry = new THREE.IcosahedronGeometry(1.2, detail);
      blob.geometry = geometry;
      extractOriginalPositions();
    };

    // --- Subscriptions ---
    const unsubscribe = store.subscribe((newConfig) => {
      // Check what changed
      if (newConfig.detail !== config.detail) {
        recreateGeometry(newConfig.detail);
      }
      if (newConfig.bgColor !== config.bgColor) {
        scene.background = new THREE.Color(newConfig.bgColor);
        document.body.style.backgroundColor = newConfig.bgColor;
      }
      if (newConfig.primaryColor !== config.primaryColor) {
        light1.color.set(newConfig.primaryColor);
      }
      if (newConfig.accentColor !== config.accentColor) {
        light2.color.set(newConfig.accentColor);
      }
      config = newConfig; // update local ref
    });

    // --- Audio Init ---
    startAudioCapture((data: Uint8Array) => {
      audioData = data;
    }).catch(console.error);

    // --- Resize Handler ---
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // --- Render Loop ---
    const tempVertex = new THREE.Vector3();
    
    const animate = () => {
      animationId = requestAnimationFrame(animate);

      blob.rotation.x += 0.002 * config.rotationSpeed;
      blob.rotation.y += 0.003 * config.rotationSpeed;
      time += 0.008;

      let currentVolume = 0;
      let currentBass = 0;
      let currentTreble = 0;

      if (audioData) {
        const avgVolume = audioData.reduce((a, b) => a + b, 0) / audioData.length;
        currentVolume = avgVolume / 255.0;

        currentBass = audioData.slice(0, 10).reduce((a, b) => a + b, 0) / 10 / 255.0;
        currentTreble = audioData.slice(50, 100).reduce((a, b) => a + b, 0) / 50 / 255.0;
      }

      const attack = 0.15;
      const release = 0.03;
      smoothedVolume += (currentVolume - smoothedVolume) * (currentVolume > smoothedVolume ? attack : release);
      smoothedBass   += (currentBass   - smoothedBass)   * (currentBass   > smoothedBass   ? attack : release);
      smoothedTreble += (currentTreble - smoothedTreble) * (currentTreble > smoothedTreble ? attack : release);

      time += smoothedVolume * 0.02;

      const posAttr = geometry.getAttribute('position');
      const noiseFreq = 0.8 + (smoothedTreble * 0.8);
      const noiseAmp = smoothedVolume * config.sensitivity * (0.4 + smoothedBass * 2.5);

      for (let i = 0; i < posAttr.count; i++) {
        const ix = i * 3;
        // Reuse temporary vertex instead of allocating new ones
        tempVertex.set(originalPositions[ix], originalPositions[ix + 1], originalPositions[ix + 2]);
        
        let noiseVal = noise3D(
            tempVertex.x * noiseFreq + time, 
            tempVertex.y * noiseFreq + time, 
            tempVertex.z * noiseFreq + time
        );

        const baseRadius = config.baseRadius + (smoothedVolume * 0.1); 
        const scale = baseRadius + noiseVal * noiseAmp * config.rippleDepth;

        // Multiply direction by scale - tempVertex itself IS the direction since it's centered at 0,0,0
        // We just need to normalize it once if it's not a unit sphere, but for icosahedron it's close enough 
        // OR we can be precise and normalize it.
        tempVertex.normalize().multiplyScalar(scale);
        posAttr.setXYZ(i, tempVertex.x, tempVertex.y, tempVertex.z);
      }
      
      posAttr.needsUpdate = true;
      geometry.computeVertexNormals();
      
      renderer.render(scene, camera);
    };

    animate();

    // --- Cleanup ---
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', handleResize);
      unsubscribe();
      
      geometry.dispose();
      material.dispose();
      renderer.dispose();
      
      if (containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />;
};
