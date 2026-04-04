import * as THREE from 'three';

/**
 * GLSL Simplex Noise (3D)
 * This is a standard math function used in graphics programming to create
 * smooth, natural-looking randomness. We use it to create the bumps on the blob.
 * It's written in GLSL (OpenGL Shading Language) which runs directly on the GPU.
 */
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

/**
 * These are "uniforms" - variables that we pass from JavaScript (CPU)
 * into the GPU shader program every frame. This allows us to animate
 * the material using audio data over time.
 */
export const blobShaderUniforms = {
  uTime: { value: 0 },
  uNoiseFreq: { value: 0 },
  uNoiseAmp: { value: 0 },
  uBaseRadius: { value: 1.5 },
  uRippleDepth: { value: 1.0 },
};

/**
 * Creates and returns the custom material for the Blob.
 * It uses a standard Three.js MeshPhysicalMaterial, but we "inject" custom
 * shader code into it before it compiles to modify the vertex positions.
 */
export const createBlobMaterial = () => {
  // A MeshPhysicalMaterial provides realistic lighting, reflections, and iridescence.
  const material = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    metalness: 0.1,
    roughness: 0.1,
    clearcoat: 1.0, // Makes it look like it has a wet, glossy layer
    clearcoatRoughness: 0.1,
    iridescence: 1.0, // Gives it the rainbow pearlescent effect
    iridescenceIOR: 1.5,
    iridescenceThicknessRange: [100, 400],
    flatShading: true, // Gives the low-poly look instead of smooth curves
  });

  // onBeforeCompile is a Three.js hook that lets us modify the shader source code
  // right before it's sent to the GPU. We use it to deform the blob sphere into organic shapes.
  material.onBeforeCompile = (shader) => {
    // 1. Link our JavaScript uniforms to the shader
    shader.uniforms.uTime = blobShaderUniforms.uTime;
    shader.uniforms.uNoiseFreq = blobShaderUniforms.uNoiseFreq;
    shader.uniforms.uNoiseAmp = blobShaderUniforms.uNoiseAmp;
    shader.uniforms.uBaseRadius = blobShaderUniforms.uBaseRadius;
    shader.uniforms.uRippleDepth = blobShaderUniforms.uRippleDepth;

    // 2. Add our custom variables and noise functions to the top of the vertex shader
    shader.vertexShader =
      `
      uniform float uTime;
      uniform float uNoiseFreq;
      uniform float uNoiseAmp;
      uniform float uBaseRadius;
      uniform float uRippleDepth;
      
      ${glslSnoise}
      
      // Calculate how far a vertex should be pushed out from the center
      float getDisplacement(vec3 p) {
          float noiseVal = snoise(p * uNoiseFreq + vec3(uTime));
          return uBaseRadius + noiseVal * uNoiseAmp * uRippleDepth;
      }

      // Calculate the final 3D position of the vertex
      vec3 getDisplacedPosition(vec3 p) {
          vec3 dir = normalize(p); // Direction from center
          return dir * getDisplacement(p);
      }
    ` + shader.vertexShader;

    // 3. Three.js normally calculates how light hits a surface using "normals"
    // Since we are moving the vertices, we need to recalculate these normals
    // mathematically so the light bounces off the new bumps correctly.
    shader.vertexShader = shader.vertexShader.replace(
      '#include <beginnormal_vertex>',
      `
      vec3 objectNormal = vec3( normal );

      // Where the vertex actually is now
      vec3 displacedPos = getDisplacedPosition(position);

      // We sample two points very close by to calculate the slope (tangent and bitangent)
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

      // The cross product of the two slopes gives us our new normal (perpendicular vector)
      vec3 newNormal = normalize(cross(dp1 - displacedPos, dp2 - displacedPos));
      if(dot(newNormal, objectNormal) < 0.0) {
          newNormal = -newNormal;
      }
      objectNormal = newNormal;
      `,
    );

    // 4. Finally, we tell Three.js to use our displaced position for the actual vertex placement
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      vec3 transformed = displacedPos;
      `,
    );
  };

  return material;
};
