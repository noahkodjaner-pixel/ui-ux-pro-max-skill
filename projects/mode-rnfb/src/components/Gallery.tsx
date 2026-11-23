import { useRef, useState } from 'react';
import { gsap, MQ, SplitText, useGsap } from '../lib/gsap';
import { gallery } from '../config/salon';
import { Still } from '../lib/Still';
import { Lightbox } from './Lightbox';

export function Gallery() {
  const ref = useRef<HTMLElement>(null);
  const [open, setOpen] = useState<number | null>(null);
  const hasDemo = gallery.some((g) => g.status === 'demo');

  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      const split = SplitText.create(el.querySelector('.gallery__title'), { type: 'words,chars', charsClass: 'ch', mask: 'chars' });
      gsap.from(split.chars, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: '.gallery__title', start: 'top 82%' } });
      return () => split.revert();
    });

    // Desktop : défilement horizontal piloté par le scroll vertical.
    mm.add(MQ.desktop, () => {
      el.classList.add('is-pinned');
      const viewport = el.querySelector<HTMLElement>('.gallery__viewport')!;
      const track = el.querySelector<HTMLElement>('.gallery__track')!;
      const distance = () => Math.max(0, track.scrollWidth - viewport.clientWidth);
      const scroll = gsap.to(track, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: viewport,
          start: 'center center',
          end: () => `+=${distance()}`,
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
        },
      });
      gsap.to('.gallery__progress span', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: viewport, start: 'center center', end: () => `+=${distance()}`, scrub: true } });
      // Parallaxe interne : chaque image glisse dans son cadre.
      gsap.utils.toArray<HTMLElement>('.shot__btn img').forEach((img) => {
        gsap.fromTo(img, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: img.parentElement, containerAnimation: scroll, start: 'left right', end: 'right left', scrub: true },
        });
      });
      return () => el.classList.remove('is-pinned');
    });
  });

  return (
    <section ref={ref} id="galerie" className="section gallery" data-theme="dark" aria-labelledby="galerie-title">
      <div className="wrap">
        <div className="section__top">
          <span className="idx">(04) Galerie</span>
          {hasDemo && <span className="demo-tag">Visuels de démonstration</span>}
        </div>
        <div className="gallery__head">
          <h2 id="galerie-title" className="gallery__title display">Études <em>de matière</em></h2>
          {hasDemo && (
            <p className="notice">
              Rendus 3D créés pour cette démonstration, à partir du même moteur que la page d’accueil. Ce ne sont pas des réalisations du salon : ses photographies prendront leur place.
            </p>
          )}
        </div>
      </div>

      <div className="gallery__viewport" tabIndex={-1}>
        <ul className="gallery__track">
          {gallery.map((g, i) => (
            <li className={`shot shot--${g.shape}`} key={g.id}>
              <button className="shot__btn" type="button" onClick={() => setOpen(i)} aria-label={`Agrandir : ${g.title}`}>
                <span className="shot__zoom"><Still src={g.src} alt={g.alt} sizes="(min-width: 900px) 50vw, 85vw" /></span>
              </button>
              <p className="shot__cap"><b>{g.title}</b><span>{String(i + 1).padStart(2, '0')} / {String(gallery.length).padStart(2, '0')}</span></p>
            </li>
          ))}
        </ul>
        <div className="gallery__progress" aria-hidden="true"><span /></div>
      </div>

      <Lightbox items={gallery} index={open} onChange={setOpen} />
    </section>
  );
}
