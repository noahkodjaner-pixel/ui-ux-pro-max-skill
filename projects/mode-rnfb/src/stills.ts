/**
 * Outil de production (non publié) : rend les « études de matière » 3D utilisées
 * comme visuels de démonstration dans la galerie, à partir du même moteur que le hero.
 * Lancé par scripts/render-stills.mjs. Ce ne sont PAS des photos du salon.
 */
import { RibbonField, defaultPalette, type RibbonFieldOptions } from './three/RibbonField';

type Variant = { id: string; w: number; h: number; morph: number; time: number } & Partial<RibbonFieldOptions>;

const variants: Variant[] = [
  { id: 'hero', w: 2400, h: 1500, morph: 0.15, time: 4, background: '#101010' },
  { id: 'etude-01', w: 1600, h: 2000, morph: 0.05, time: 11, background: '#101010', seed: 11, camera: { x: 0.6, y: 0.2, z: 5.2, fov: 32 }, tilt: -0.9, width: 0.03, count: 200 },
  { id: 'etude-02', w: 2000, h: 1400, morph: 0.85, time: 2, background: '#F2EEE8', seed: 22, palette: [{ color: '#272727', weight: 3 }, { color: '#C7AC83', weight: 3 }, { color: '#8C7556', weight: 2 }], tilt: -0.25 },
  { id: 'etude-03', w: 1600, h: 2000, morph: 0.5, time: 7, background: '#272727', seed: 33, camera: { x: -0.4, y: 0, z: 4.4, fov: 30 }, tilt: 1.1, width: 0.028, count: 220 },
  { id: 'etude-04', w: 1600, h: 1600, morph: 1, time: 9, background: '#C7AC83', seed: 44, palette: [{ color: '#F2EEE8', weight: 3 }, { color: '#FFFFFF', weight: 1 }, { color: '#272727', weight: 2 }], tilt: 0.55 },
  { id: 'etude-05', w: 1600, h: 2000, morph: 0.2, time: 15, background: '#0c0c0c', seed: 55, palette: [{ color: '#F2EEE8', weight: 4 }, { color: '#C7AC83', weight: 2 }], camera: { x: 0, y: 0.3, z: 3.6, fov: 34 }, tilt: -1.3, count: 90, width: 0.035 },
  { id: 'etude-06', w: 2000, h: 1400, morph: 0.65, time: 5, background: '#101010', seed: 66, palette: [{ color: '#C7AC83', weight: 4 }, { color: '#5A5651', weight: 2 }], tilt: 0.2 },
  { id: 'etude-07', w: 1600, h: 2000, morph: 0.9, time: 12, background: '#F2EEE8', seed: 77, palette: [{ color: '#C7AC83', weight: 3 }, { color: '#E6D3B3', weight: 2 }, { color: '#272727', weight: 1 }], camera: { x: 0.5, y: -0.2, z: 4.8, fov: 30 }, tilt: 1.45, width: 0.03, count: 200 },
  { id: 'etude-08', w: 1600, h: 1600, morph: 0.35, time: 3, background: '#1a1a1a', seed: 88, palette: [{ color: '#8C7556', weight: 2 }, { color: '#C7AC83', weight: 3 }, { color: '#FFFFFF', weight: 1 }], camera: { x: 0, y: 0, z: 4, fov: 32 }, tilt: -0.6, width: 0.03, count: 200 },
];

declare global {
  interface Window { __variants: Variant[]; __render: (id: string) => Promise<void>; }
}

const canvas = document.getElementById('c') as HTMLCanvasElement;
let field: RibbonField | null = null;

window.__variants = variants;
window.__render = async (id) => {
  const v = variants.find((x) => x.id === id);
  if (!v) throw new Error(`variante inconnue : ${id}`);
  field?.dispose();
  canvas.style.width = `${v.w / 2}px`;
  canvas.style.height = `${v.h / 2}px`;
  field = new RibbonField(canvas, {
    count: v.count ?? 150,
    segments: 260,
    maxDpr: 2,
    palette: v.palette ?? defaultPalette,
    background: v.background ?? '#101010',
    seed: v.seed ?? 7,
    width: v.width ?? 0.045,
    tilt: v.tilt ?? -0.35,
    camera: v.camera ?? { x: 0, y: 0, z: 9, fov: 35 },
    pointer: false,
    preserveDrawingBuffer: true,
  });
  field.resize();
  field.setTime(v.time);
  field.jumpMorph(v.morph);
  field.renderOnce();
  await new Promise((r) => requestAnimationFrame(() => r(null)));
};
