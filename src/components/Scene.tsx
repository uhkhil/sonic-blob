import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { store } from '../store';
import { startAudioCapture } from '../audio';

const glslSnoise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
vec3 fade(vec3 t) { return t*t*t*(t*(t*6.0-15.0)+10.0); }

float snoise(vec3 P) {
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod289(Pi0);
  Pi1 = mod289(Pi1);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;

  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);

  vec4 gx0 = ixy0 * (1.0 / 7.0);
  vec4 gy0 = fract(floor(gx0) * (1.0 / 7.0)) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);

  vec4 gx1 = ixy1 * (1.0 / 7.0);
  vec4 gy1 = fract(floor(gx1) * (1.0 / 7.0)) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);

  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);

  vec4 norm0 = taylorInvSqrt(vec4(dot(g000, g000), dot(g010, g010), dot(g100, g100), dot(g110, g110)));
  g000 *= norm0.x;
  g010 *= norm0.y;
  g100 *= norm0.z;
  g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001, g001), dot(g011, g011), dot(g101, g101), dot(g111, g111)));
  g001 *= norm1.x;
  g011 *= norm1.y;
  g101 *= norm1.z;
  g111 *= norm1.w;

  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x, Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x, Pf1.y, Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy, Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy, Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x, Pf0.y, Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x, Pf1.yz));
  float n111 = dot(g111, Pf1);

  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000, n100, n010, n110), vec4(n001, n101, n011, n111), fade_xyz.z);
  vec2 n_yz = mix(n_z.xy, n_z.zw, fade_xyz.y);
  float n_xyz = mix(n_yz.x, n_yz.y, fade_xyz.x); 
  return 2.2 * n_xyz;
}
`;

export const Scene = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

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

    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000,
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
    scene.add(ambientLight);

    const light1 = new THREE.DirectionalLight(config.primaryColor, 8.0);
    light1.position.set(-5, 5, 5); // Mirrored with light2 horizontally
    scene.add(light1);

    const light2 = new THREE.DirectionalLight(config.accentColor, 3.0);
    light2.position.set(5, 5, 5);
    scene.add(light2);

    const light3 = new THREE.DirectionalLight(0xffffff, 0.3);
    light3.position.set(0, -5, 5); // Move the white fill light to the bottom to balance the top lights
    scene.add(light3);

    // --- Geometry & Material ---
    let geometry = new THREE.IcosahedronGeometry(1.2, config.detail);
    
    // Shader Uniforms
    const shaderUniforms = {
      uTime: { value: 0 },
      uNoiseFreq: { value: 0 },
      uNoiseAmp: { value: 0 },
      uBaseRadius: { value: 1.5 },
      uRippleDepth: { value: 1.0 }
    };

    const material = new THREE.MeshPhysicalMaterial({
      color: 0xffffff,
      metalness: 0.1,
      roughness: 0.1,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      iridescence: 1.0,
      iridescenceIOR: 1.5,
      iridescenceThicknessRange: [100, 400],
      flatShading: true,
    });

    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = shaderUniforms.uTime;
      shader.uniforms.uNoiseFreq = shaderUniforms.uNoiseFreq;
      shader.uniforms.uNoiseAmp = shaderUniforms.uNoiseAmp;
      shader.uniforms.uBaseRadius = shaderUniforms.uBaseRadius;
      shader.uniforms.uRippleDepth = shaderUniforms.uRippleDepth;

      shader.vertexShader = `
        uniform float uTime;
        uniform float uNoiseFreq;
        uniform float uNoiseAmp;
        uniform float uBaseRadius;
        uniform float uRippleDepth;
        
        ${glslSnoise}
        
        float getDisplacement(vec3 p) {
            float noiseVal = snoise(p * uNoiseFreq + vec3(uTime));
            return uBaseRadius + noiseVal * uNoiseAmp * uRippleDepth;
        }

        vec3 getDisplacedPosition(vec3 p) {
            vec3 dir = normalize(p);
            return dir * getDisplacement(p);
        }
      ` + shader.vertexShader;

      shader.vertexShader = shader.vertexShader.replace(
        '#include <beginnormal_vertex>',
        `
        vec3 objectNormal = vec3( normal );

        vec3 displacedPos = getDisplacedPosition(position);

        float epsilon = 0.001;
        vec3 tangent = normalize(cross(objectNormal, vec3(0.0, 1.0, 0.0)));
        if (length(tangent) < 0.1) {
            tangent = normalize(cross(objectNormal, vec3(1.0, 0.0, 0.0)));
        }
        vec3 bitangent = cross(objectNormal, tangent);

        vec3 p1 = position + tangent * epsilon;
        vec3 p2 = position + bitangent * epsilon;

        vec3 dp1 = getDisplacedPosition(p1);
        vec3 dp2 = getDisplacedPosition(p2);

        vec3 newNormal = normalize(cross(dp1 - displacedPos, dp2 - displacedPos));
        if(dot(newNormal, objectNormal) < 0.0) {
            newNormal = -newNormal;
        }
        objectNormal = newNormal;
        `
      );

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
        vec3 transformed = displacedPos;
        `
      );
    };

    const blob = new THREE.Mesh(geometry, material);
    scene.add(blob);

    const recreateGeometry = (detail: number) => {
      geometry.dispose();
      geometry = new THREE.IcosahedronGeometry(1.2, detail);
      blob.geometry = geometry;
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

    const animate = () => {
      animationId = requestAnimationFrame(animate);

      blob.rotation.x += 0.002 * config.rotationSpeed;
      blob.rotation.y += 0.003 * config.rotationSpeed;
      time += 0.008;

      let currentVolume = 0;
      let currentBass = 0;
      let currentTreble = 0;

      if (audioData && audioData.length > 0) {
        const captureLen = Math.floor(config.audioSamples);
        const actualLen = Math.min(captureLen, audioData.length);

        if (actualLen > 0) {
          let volSum = 0;
          for (let i = 0; i < actualLen; i++) {
            volSum += audioData[i];
          }
          currentVolume = (volSum / actualLen) / 255.0;

          const bassEnd = Math.max(1, Math.floor(actualLen * 0.1));
          let bassSum = 0;
          for (let i = 0; i < bassEnd; i++) {
            bassSum += audioData[i];
          }
          currentBass = (bassSum / bassEnd) / 255.0;

          const trebleStart = Math.min(
            actualLen - 1,
            Math.floor(actualLen * 0.4),
          );
          const trebleCount = actualLen - trebleStart;
          let trebleSum = 0;
          if (trebleCount > 0) {
            for (let i = trebleStart; i < actualLen; i++) {
              trebleSum += audioData[i];
            }
            currentTreble = (trebleSum / trebleCount) / 255.0;
          }
        }
      }

      const attack = 0.15;
      const release = 0.03;
      smoothedVolume +=
        (currentVolume - smoothedVolume) *
        (currentVolume > smoothedVolume ? attack : release);
      smoothedBass +=
        (currentBass - smoothedBass) *
        (currentBass > smoothedBass ? attack : release);
      smoothedTreble +=
        (currentTreble - smoothedTreble) *
        (currentTreble > smoothedTreble ? attack : release);

      time += smoothedVolume * 0.02;

      // Control whether to use the 'global' smoother waves or 'individual' spiky waves
      let noiseFreq, noiseAmp;
      if (config.moveTogether) {
        noiseFreq = 0.2 + smoothedTreble * 0.4;
        noiseAmp =
          smoothedVolume * config.sensitivity * (0.5 + smoothedBass * 1.5);
      } else {
        noiseFreq = 0.8 + smoothedTreble * 0.8;
        noiseAmp =
          smoothedVolume * config.sensitivity * (0.4 + smoothedBass * 2.5);
      }
      const baseRadius = config.baseRadius + smoothedVolume * 0.1;

      shaderUniforms.uTime.value = time;
      shaderUniforms.uNoiseFreq.value = noiseFreq;
      shaderUniforms.uNoiseAmp.value = noiseAmp;
      shaderUniforms.uBaseRadius.value = baseRadius;
      shaderUniforms.uRippleDepth.value = config.rippleDepth;

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

      if (container) {
        container.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div ref={containerRef} className="absolute inset-0 z-0 w-full h-full" />
  );
};
