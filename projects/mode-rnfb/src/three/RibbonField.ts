/**
 * RibbonField — rubans 3D évoquant des mèches en mouvement.
 *
 * Toute la géométrie est calculée dans le vertex shader (un seul draw call) :
 * chaque ruban suit une courbe qui interpole entre un état « mouvement »
 * (mèches libres, entremêlées) et un état « ligne » (mèches peignées, parallèles).
 * Ce passage de l'un à l'autre, piloté par le scroll, est le fil narratif du site :
 * THE ART OF TRANSFORMATION.
 *
 * Le matériau est un MeshPhysicalMaterial (sheen + clearcoat) éclairé par un
 * environnement de studio procédural (RoomEnvironment), sans texture externe.
 */
import {
  ACESFilmicToneMapping,
  BufferAttribute,
  BufferGeometry,
  Color,
  DirectionalLight,
  Fog,
  DoubleSide,
  Mesh,
  MeshPhysicalMaterial,
  PMREMGenerator,
  PerspectiveCamera,
  Scene,
  SRGBColorSpace,
  Vector2,
  Vector3,
  WebGLRenderer,
  type WebGLProgramParametersWithUniforms,
} from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

export interface RibbonFieldOptions {
  /** Nombre de rubans (réduit sur mobile). */
  count: number;
  /** Segments par ruban. */
  segments: number;
  /** Ratio de pixels maximal. */
  maxDpr: number;
  /** Couleurs des rubans, tirées avec la pondération indiquée. */
  palette: Array<{ color: string; weight: number }>;
  /** Couleur de fond opaque (stills) ou null (canvas transparent). */
  background: string | null;
  /** Graine pseudo-aléatoire : même graine = même composition. */
  seed: number;
  /** Largeur des rubans. */
  width: number;
  /** Rotation de la composition (radians). */
  tilt: number;
  /** Position de la caméra. */
  camera: { x: number; y: number; z: number; fov: number };
  /** Couleur du brouillard de profondeur (par défaut : le fond). */
  fog?: string;
  /** Active la réaction au pointeur. */
  pointer: boolean;
  /** Conserve le buffer pour capture d'écran (stills). */
  preserveDrawingBuffer?: boolean;
}

export const defaultPalette: RibbonFieldOptions['palette'] = [
  { color: '#C7AC83', weight: 5 },
  { color: '#E6D3B3', weight: 2 },
  { color: '#F2EEE8', weight: 2 },
  { color: '#5A5651', weight: 2 },
  { color: '#8C7556', weight: 2 },
];

/** PRNG déterministe (mulberry32). */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const vertexCommon = /* glsl */ `
attribute vec2 aRib;   // x : position dans la largeur (0..1), y : position le long du ruban (0..1)
attribute vec4 aSeed;  // aléas propres à chaque ruban
uniform float uTime;
uniform float uMorph;
uniform vec2 uPointer;
uniform float uPointerAmt;
uniform float uLength;
uniform float uWidth;

vec3 rbSpine(float t, float lock) {
  float x = (t - 0.5) * uLength;
  float y = sin(t * 2.7 + lock * 2.1 + uTime * 0.17) * 1.15 + (lock - 1.0) * 0.85;
  float z = cos(t * 1.9 + lock * 1.4 + uTime * 0.14) * 0.95;
  return vec3(x, y, z);
}

// « Mouvement » : trois mèches torsadées, chaque brin s'enroule autour de sa mèche.
vec3 rbMotion(float t, vec4 s) {
  float lock = floor(s.y * 2.999);
  vec3 c = rbSpine(t, lock);
  float a = t * (5.5 + lock * 1.6) + s.x * 6.2831853 + uTime * 0.38 * (0.5 + s.z);
  float r = (0.12 + s.w * 0.6) * (0.55 + 0.45 * sin(t * 3.14159));
  return c + vec3(0.0, cos(a) * r, sin(a) * r);
}

// « Ligne » : les brins se démêlent en une seule nappe peignée.
vec3 rbLine(float t, vec4 s) {
  float lane = s.w - 0.5;
  float x = (t - 0.5) * uLength;
  float wave = sin(t * 2.2 - uTime * 0.3) * 0.85 + sin(t * 5.0 - uTime * 0.18) * 0.06;
  float y = lane * 1.7 + wave * (1.0 - abs(lane) * 0.3);
  float z = (s.x - 0.5) * 0.3 + cos(t * 2.2 - uTime * 0.3) * 0.45;
  return vec3(x, y, z);
}

vec3 rbPos(float t, vec4 s) {
  float m = clamp(uMorph * 1.35 - s.x * 0.35, 0.0, 1.0);
  m = m * m * (3.0 - 2.0 * m);
  vec3 p = mix(rbMotion(t, s), rbLine(t, s), m);
  vec2 d = p.xy - uPointer;
  float f = exp(-dot(d, d) * 0.9) * uPointerAmt;
  p.z += f * 0.9;
  p.y += sign(d.y) * f * 0.18;
  return p;
}
`;

const vertexNormal = /* glsl */ `
  float rbT = aRib.y;
  vec3 rbP = rbPos(rbT, aSeed);
  vec3 rbTan = normalize(rbPos(rbT + 0.0025, aSeed) - rbPos(rbT - 0.0025, aSeed));
  vec3 rbRef = abs(rbTan.z) > 0.92 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
  vec3 rbB = normalize(cross(rbTan, rbRef));
  vec3 rbN0 = normalize(cross(rbB, rbTan));
  float rbTw = rbT * (2.5 + aSeed.z * 4.0) * (1.0 - uMorph * 0.75) + aSeed.x * 6.2831853 + uTime * 0.12;
  vec3 rbSide = rbB * cos(rbTw) + rbN0 * sin(rbTw);
  float rbTaper = smoothstep(0.0, 0.07, rbT) * smoothstep(1.0, 0.9, rbT);
  vec3 rbOffset = rbSide * (aRib.x - 0.5) * uWidth * (0.55 + aSeed.z * 0.9) * rbTaper;
  vec3 objectNormal = normalize(cross(rbTan, rbSide));
`;

export class RibbonField {
  readonly renderer: WebGLRenderer;
  readonly scene = new Scene();
  readonly camera: PerspectiveCamera;
  private readonly mesh: Mesh<BufferGeometry, MeshPhysicalMaterial>;
  private last = 0;
  private readonly uniforms = {
    uTime: { value: 0 },
    uMorph: { value: 0 },
    uPointer: { value: new Vector2(0, 0) },
    uPointerAmt: { value: 0 },
    uLength: { value: 13 },
    uWidth: { value: 0.07 },
  };
  private readonly baseCam: Vector3;
  private pointerTarget = new Vector2(0, 0);
  private pointerNdc = new Vector2(0, 0);
  private pointerAmtTarget = 0;
  private morphTarget = 0;
  private scrollTilt = 0;
  private raf = 0;
  private running = false;
  private speed = 1;
  private disposed = false;

  constructor(private readonly canvas: HTMLCanvasElement, private readonly opts: RibbonFieldOptions) {
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      alpha: opts.background === null,
      powerPreference: 'high-performance',
      preserveDrawingBuffer: !!opts.preserveDrawingBuffer,
    });
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    if (opts.background) this.scene.background = new Color(opts.background);
    this.scene.fog = new Fog(opts.fog ?? opts.background ?? '#101010', opts.camera.z + 1, opts.camera.z + 7);

    const pmrem = new PMREMGenerator(this.renderer);
    this.scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    pmrem.dispose();

    const key = new DirectionalLight('#fff3e0', 2.2);
    key.position.set(-4, 6, 5);
    const rim = new DirectionalLight('#dfe8ff', 1.1);
    rim.position.set(5, -2, -4);
    this.scene.add(key, rim);

    this.camera = new PerspectiveCamera(opts.camera.fov, 1, 0.1, 100);
    this.camera.position.set(opts.camera.x, opts.camera.y, opts.camera.z);
    this.baseCam = this.camera.position.clone();
    this.camera.lookAt(0, 0, 0);

    this.uniforms.uWidth.value = opts.width;
    this.mesh = new Mesh(this.buildGeometry(), this.buildMaterial());
    this.mesh.frustumCulled = false;
    this.mesh.rotation.z = opts.tilt;
    this.mesh.rotation.x = -0.12;
    this.scene.add(this.mesh);

    this.resize();
  }

  private buildGeometry() {
    const { count, segments, palette, seed } = this.opts;
    const rand = rng(seed);
    const verts = count * (segments + 1) * 2;
    const rib = new Float32Array(verts * 2);
    const seeds = new Float32Array(verts * 4);
    const colors = new Float32Array(verts * 3);
    const index: number[] = [];
    const total = palette.reduce((s, p) => s + p.weight, 0);
    const pick = () => {
      let r = rand() * total;
      for (const p of palette) if ((r -= p.weight) <= 0) return new Color(p.color);
      return new Color(palette[0].color);
    };
    let v = 0;
    for (let i = 0; i < count; i++) {
      const s = [rand(), rand(), rand(), rand()];
      const c = pick().convertSRGBToLinear();
      const base = v;
      for (let j = 0; j <= segments; j++) {
        const t = j / segments;
        for (let k = 0; k < 2; k++) {
          rib.set([k, t], v * 2);
          seeds.set(s, v * 4);
          colors.set([c.r, c.g, c.b], v * 3);
          v++;
        }
        if (j < segments) {
          const a = base + j * 2;
          index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
        }
      }
    }
    const g = new BufferGeometry();
    g.setAttribute('position', new BufferAttribute(new Float32Array(verts * 3), 3));
    g.setAttribute('aRib', new BufferAttribute(rib, 2));
    g.setAttribute('aSeed', new BufferAttribute(seeds, 4));
    g.setAttribute('color', new BufferAttribute(colors, 3));
    g.setIndex(index);
    return g;
  }

  private buildMaterial() {
    const m = new MeshPhysicalMaterial({
      vertexColors: true,
      metalness: 0.62,
      roughness: 0.24,
      sheen: 0.8,
      sheenRoughness: 0.35,
      sheenColor: new Color('#fff6e8'),
      clearcoat: 0.35,
      clearcoatRoughness: 0.22,
      envMapIntensity: 1.15,
      side: DoubleSide,
    });
    m.onBeforeCompile = (shader: WebGLProgramParametersWithUniforms) => {
      Object.assign(shader.uniforms, this.uniforms);
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${vertexCommon}`)
        .replace('#include <beginnormal_vertex>', vertexNormal)
        .replace('#include <begin_vertex>', 'vec3 transformed = rbP + rbOffset;');
    };
    return m;
  }

  /** Progression de la transformation : 0 = mouvement libre, 1 = ligne. */
  setMorph(v: number) {
    this.morphTarget = v;
  }

  /** Inclinaison supplémentaire liée au scroll (0..1). */
  setScrollTilt(v: number) {
    this.scrollTilt = v;
  }

  /** Pointeur en coordonnées normalisées (-1..1). */
  setPointer(nx: number, ny: number) {
    if (!this.opts.pointer) return;
    this.pointerNdc.set(nx, ny);
    const dist = this.camera.position.z;
    const h = Math.tan((this.camera.fov * Math.PI) / 360) * dist;
    this.pointerTarget.set(nx * h * this.camera.aspect, ny * h);
    this.pointerAmtTarget = 0.75;
  }

  pointerLeave() {
    this.pointerAmtTarget = 0;
  }

  /** Vitesse du temps (0 pour figer, ex. prefers-reduced-motion). */
  setSpeed(v: number) {
    this.speed = v;
  }

  setTime(t: number) {
    this.uniforms.uTime.value = t;
  }

  /** Force immédiatement la transformation (stills, mouvement réduit). */
  jumpMorph(v: number) {
    this.morphTarget = v;
    this.uniforms.uMorph.value = v;
  }

  resize() {
    const w = this.canvas.clientWidth || this.canvas.width;
    const h = this.canvas.clientHeight || this.canvas.height;
    if (!w || !h) return;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, this.opts.maxDpr));
    this.renderer.setSize(w, h, false);
    this.camera.aspect = w / h;
    // Portrait : on recule la caméra pour garder la composition lisible.
    const portrait = w / h < 0.8;
    this.camera.position.z = this.baseCam.z * (portrait ? 1.45 : 1);
    this.camera.updateProjectionMatrix();
  }

  private tick = () => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.tick);
    const now = performance.now();
    const dt = Math.min((now - this.last) / 1000, 1 / 20);
    this.last = now;
    this.update(dt);
  };

  update(dt: number) {
    const u = this.uniforms;
    u.uTime.value += dt * this.speed;
    const k = 1 - Math.pow(0.0015, dt);
    u.uMorph.value += (this.morphTarget - u.uMorph.value) * k;
    u.uPointer.value.lerp(this.pointerTarget, 1 - Math.pow(0.02, dt));
    u.uPointerAmt.value += (this.pointerAmtTarget - u.uPointerAmt.value) * (1 - Math.pow(0.05, dt));
    // Caméra : parallaxe douce au pointeur.
    const cam = this.camera;
    const tx = this.baseCam.x + this.pointerNdc.x * 0.35;
    const ty = this.baseCam.y + this.pointerNdc.y * 0.22;
    cam.position.x += (tx - cam.position.x) * k;
    cam.position.y += (ty - cam.position.y) * k;
    cam.lookAt(0, 0, 0);
    this.mesh.rotation.z = this.opts.tilt + this.scrollTilt * 0.22;
    this.mesh.rotation.x = -0.12 + this.scrollTilt * 0.35;
    this.renderer.render(this.scene, cam);
  }

  renderOnce() {
    this.update(0);
  }

  start() {
    if (this.running || this.disposed) return;
    this.running = true;
    this.last = performance.now();
    this.raf = requestAnimationFrame(this.tick);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  dispose() {
    this.stop();
    this.disposed = true;
    this.mesh.geometry.dispose();
    this.mesh.material.dispose();
    this.scene.environment?.dispose();
    this.renderer.dispose();
  }
}

export function supportsWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(c.getContext('webgl2') || c.getContext('webgl'));
  } catch {
    return false;
  }
}
