import { useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { gsap, MQ } from '../lib/gsap';
import type { Visual } from '../config/salon';
import { stillSrc } from '../lib/Still';

interface Props {
  items: Visual[];
  index: number | null;
  onChange: (i: number | null) => void;
}

/** Visionneuse plein écran : <dialog> natif (focus piégé, Échap), flèches clavier, balayage tactile. */
export function Lightbox({ items, index, onChange }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const opener = useRef<HTMLElement | null>(null);
  const item = index === null ? null : items[index];
  const reduce = typeof window !== 'undefined' && matchMedia(MQ.reduce).matches;

  useEffect(() => {
    const d = dialog.current;
    if (!d) return;
    if (index !== null && !d.open) {
      opener.current = document.activeElement as HTMLElement | null;
      d.showModal();
      document.documentElement.style.overflow = 'hidden';
      if (!reduce) gsap.fromTo(d, { opacity: 0 }, { opacity: 1, duration: 0.5, ease: 'power2.out' });
    } else if (index === null && d.open) {
      d.close();
    }
  }, [index, reduce]);

  useEffect(() => {
    if (index === null || reduce || !img.current) return;
    gsap.fromTo(img.current, { opacity: 0, scale: 0.97 }, { opacity: 1, scale: 1, duration: 0.7, ease: 'expo.out' });
  }, [index, reduce]);

  const go = (dir: 1 | -1) => {
    if (index === null) return;
    onChange((index + dir + items.length) % items.length);
  };

  const onClose = () => {
    document.documentElement.style.overflow = '';
    onChange(null);
    opener.current?.focus();
  };

  // Balayage tactile
  const start = useRef<number | null>(null);

  return (
    <dialog
      ref={dialog}
      className="lightbox"
      aria-label="Visionneuse de la galerie"
      onClose={onClose}
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
      }}
    >
      {item && (
        <div className="lightbox__in">
          <div className="lightbox__bar">
            <span className="idx" aria-live="polite">{String(index! + 1).padStart(2, '0')} / {String(items.length).padStart(2, '0')}</span>
            <button className="icon-btn" type="button" onClick={() => dialog.current?.close()} aria-label="Fermer la visionneuse" autoFocus>
              <X aria-hidden="true" />
            </button>
          </div>
          <div
            className="lightbox__stage"
            onPointerDown={(e) => { start.current = e.clientX; }}
            onPointerUp={(e) => {
              if (start.current === null) return;
              const dx = e.clientX - start.current;
              start.current = null;
              if (Math.abs(dx) > 50) go(dx < 0 ? 1 : -1);
            }}
          >
            <img ref={img} key={item.id} src={stillSrc(item.src, 1600)} alt={item.alt} />
          </div>
          <div className="lightbox__foot">
            <div>
              <b>{item.title}</b>
              {item.status === 'demo' && <p className="idx" style={{ marginTop: '.3rem' }}>Visuel de démonstration · rendu 3D</p>}
            </div>
            <div className="lightbox__nav">
              <button className="icon-btn" type="button" onClick={() => go(-1)} aria-label="Image précédente"><ArrowLeft aria-hidden="true" /></button>
              <button className="icon-btn" type="button" onClick={() => go(1)} aria-label="Image suivante"><ArrowRight aria-hidden="true" /></button>
            </div>
          </div>
        </div>
      )}
    </dialog>
  );
}
