import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { store } from '../store';
import { startAudioCapture } from '../audio';

const glslSnoise = `
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+10.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
  vec3 i  = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;
  i = mod289(i);
  vec4 p = permute(permute(permute(i.z + vec4(0.0, i1.z, i2.z, 1.0)) + i.y + vec4(0.0, i1.y, i2.y, 1.0)) + i.x + vec4(0.0, i1.x, i2.x, 1.0));
  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;
  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);
  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);
  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));
  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  vec4 m = max(0.5 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 105.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
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
