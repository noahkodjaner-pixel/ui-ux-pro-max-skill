import { useEffect, type RefObject } from 'react';
import { gsap, MQ } from './gsap';

/** Attraction magnétique discrète, uniquement sur pointeur fin et mouvement autorisé. */
export function useMagnetic(ref: RefObject<HTMLElement | null>, strength = 0.28) {
  useEffect(() => {
    const el = ref.current;
    if (!el || !matchMedia(MQ.fine).matches || !matchMedia(MQ.motion).matches) return;
    const label = el.querySelector<HTMLElement>('.btn__label');
    const xTo = gsap.quickTo(el, 'x', { duration: 0.6, ease: 'power3.out' });
    const yTo = gsap.quickTo(el, 'y', { duration: 0.6, ease: 'power3.out' });
    const lx = label ? gsap.quickTo(label, 'x', { duration: 0.6, ease: 'power3.out' }) : null;
    const ly = label ? gsap.quickTo(label, 'y', { duration: 0.6, ease: 'power3.out' }) : null;
    const move = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2);
      const dy = e.clientY - (r.top + r.height / 2);
      xTo(dx * strength); yTo(dy * strength);
      lx?.(dx * strength * 0.35); ly?.(dy * strength * 0.35);
    };
    const leave = () => { xTo(0); yTo(0); lx?.(0); ly?.(0); };
    el.addEventListener('pointermove', move);
    el.addEventListener('pointerleave', leave);
    return () => {
      el.removeEventListener('pointermove', move);
      el.removeEventListener('pointerleave', leave);
      gsap.killTweensOf([el, label].filter(Boolean));
      gsap.set([el, label].filter(Boolean), { clearProps: 'x,y' });
    };
  }, [ref, strength]);
}
