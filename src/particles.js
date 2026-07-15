/* =========================================================================
   Three.js metallic dust field.
   - Instanced point cloud with per-particle size/phase, soft round sprites
   - Depth-based sizing (fake DOF), slow drift, shimmer
   - Mouse parallax on the whole field, scroll velocity adds turbulence
   - Density/DPR scaled down on small screens; skipped on reduced motion
   ========================================================================= */

import {
  Scene,
  PerspectiveCamera,
  WebGLRenderer,
  BufferGeometry,
  BufferAttribute,
  ShaderMaterial,
  Points,
  AdditiveBlending,
  Color,
} from 'three'

const VERT = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  attribute float aTint;

  uniform float uTime;
  uniform float uVelocity;
  uniform vec2 uMouse;

  varying float vAlpha;
  varying float vTint;

  void main() {
    vec3 p = position;

    // slow organic drift
    float t = uTime * 0.12;
    p.x += sin(t + aPhase * 6.2831) * 0.55;
    p.y += cos(t * 0.8 + aPhase * 4.7) * 0.45;
    p.y += mod(uTime * (0.05 + aPhase * 0.06), 14.0) - 7.0; // continuous rise, wraps

    // scroll turbulence
    p.x += sin(aPhase * 40.0 + uTime) * uVelocity * 0.35;
    p.y -= uVelocity * (0.6 + aPhase);

    // mouse parallax — deeper particles move more
    float depth = (p.z + 6.0) / 12.0;
    p.x += uMouse.x * depth * 1.4;
    p.y -= uMouse.y * depth * 1.0;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float size = aScale * (90.0 / -mv.z);
    gl_PointSize = clamp(size, 1.0, 12.0);

    // shimmer + fade with depth
    float twinkle = 0.55 + 0.45 * sin(uTime * (1.2 + aPhase * 2.0) + aPhase * 12.0);
    vAlpha = twinkle * smoothstep(0.0, 0.25, depth) * (1.0 - smoothstep(0.75, 1.0, depth));
    vTint = aTint;
  }
`

const FRAG = /* glsl */ `
  precision mediump float;

  uniform vec3 uColorA; // champagne gold
  uniform vec3 uColorB; // cool aluminium

  varying float vAlpha;
  varying float vTint;

  void main() {
    // soft round sprite
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float mask = smoothstep(0.5, 0.05, d);

    vec3 col = mix(uColorB, uColorA, vTint);
    gl_FragColor = vec4(col, mask * vAlpha * 0.45);
  }
`

export function createParticles(canvas) {
  const isSmall = window.innerWidth < 760
  const COUNT = isSmall ? 180 : 420

  const scene = new Scene()
  const camera = new PerspectiveCamera(50, 1, 0.1, 50)
  camera.position.z = 8

  const renderer = new WebGLRenderer({
    canvas,
    alpha: true,
    antialias: false,
    powerPreference: 'high-performance',
  })
  renderer.setClearColor(0x000000, 0)

  // Geometry — random cloud in a wide slab in front of the camera
  const positions = new Float32Array(COUNT * 3)
  const scales = new Float32Array(COUNT)
  const phases = new Float32Array(COUNT)
  const tints = new Float32Array(COUNT)

  for (let i = 0; i < COUNT; i++) {
    positions[i * 3 + 0] = (Math.random() - 0.5) * 22
    positions[i * 3 + 1] = (Math.random() - 0.5) * 14
    positions[i * 3 + 2] = (Math.random() - 0.5) * 12 - 1
    scales[i] = 0.5 + Math.random() * 1.6
    phases[i] = Math.random()
    tints[i] = Math.random() < 0.55 ? 1.0 : Math.random() * 0.4 // mostly gold, some silver
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('aScale', new BufferAttribute(scales, 1))
  geo.setAttribute('aPhase', new BufferAttribute(phases, 1))
  geo.setAttribute('aTint', new BufferAttribute(tints, 1))

  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uVelocity: { value: 0 },
      uMouse: { value: { x: 0, y: 0 } },
      uColorA: { value: new Color('#d8a24a') },
      uColorB: { value: new Color('#aeb6bd') },
    },
  })

  scene.add(new Points(geo, mat))

  // --- state fed from outside ---------------------------------------------
  const target = { mx: 0, my: 0, vel: 0 }
  const eased = { mx: 0, my: 0, vel: 0 }
  let opacity = 1

  function resize() {
    const w = window.innerWidth
    const h = window.innerHeight
    const dpr = Math.min(window.devicePixelRatio || 1, isSmall ? 1.5 : 2)
    renderer.setPixelRatio(dpr)
    renderer.setSize(w, h, false)
    camera.aspect = w / h
    camera.updateProjectionMatrix()
  }
  resize()

  let raf = null
  let running = true

  function tick(ms) {
    if (!running) return
    const t = ms * 0.001

    eased.mx += (target.mx - eased.mx) * 0.045
    eased.my += (target.my - eased.my) * 0.045
    eased.vel += (target.vel - eased.vel) * 0.08

    mat.uniforms.uTime.value = t
    mat.uniforms.uVelocity.value = eased.vel
    mat.uniforms.uMouse.value.x = eased.mx
    mat.uniforms.uMouse.value.y = eased.my

    renderer.render(scene, camera)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)

  // Pause when the tab is hidden
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      running = false
      if (raf) cancelAnimationFrame(raf)
    } else {
      running = true
      raf = requestAnimationFrame(tick)
    }
  })

  return {
    resize,
    /** normalized mouse in [-1, 1] */
    setMouse(nx, ny) {
      target.mx = nx
      target.my = ny
    },
    /** lenis velocity (px/frame-ish) */
    setVelocity(v) {
      target.vel = Math.max(-1.5, Math.min(1.5, v * 0.02))
    },
    setOpacity(o) {
      if (o === opacity) return
      opacity = o
      canvas.style.opacity = String(o)
    },
  }
}
