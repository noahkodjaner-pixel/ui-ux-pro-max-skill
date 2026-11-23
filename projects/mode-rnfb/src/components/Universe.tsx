import { useRef } from 'react';
import { gsap, MQ, SplitText, useGsap } from '../lib/gsap';
import { copy } from '../config/salon';
import { Still } from '../lib/Still';

export function Universe() {
  const ref = useRef<HTMLElement>(null);

  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      // 1. Manifeste : chaque mot s'allume au rythme du défilement.
      const split = SplitText.create(el.querySelector('.manifesto'), { type: 'words', wordsClass: 'w' });
      gsap.fromTo(split.words, { opacity: 0.14 }, {
        opacity: 1, ease: 'none', stagger: 0.1,
        scrollTrigger: { trigger: '.manifesto', start: 'top 78%', end: 'bottom 42%', scrub: true },
      });

      // 2. Le cadre photo s'ouvre, l'image se resserre (parallaxe + échelle).
      const tl = gsap.timeline({ scrollTrigger: { trigger: '.universe__visual', start: 'top bottom', end: 'bottom top', scrub: true } });
      tl.fromTo('.universe__visual', { clipPath: 'inset(14% 16% 14% 16%)' }, { clipPath: 'inset(0% 0% 0% 0%)', ease: 'power2.out', duration: 0.5 }, 0)
        .fromTo('.universe__visual img', { scale: 1.32, yPercent: -6 }, { scale: 1, yPercent: 6, ease: 'none', duration: 1 }, 0);

      // 3. Principes : filets qui se tracent, titres révélés par masque.
      gsap.utils.toArray<HTMLElement>('.principle').forEach((p, i) => {
        const t = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%' } });
        t.from(p.querySelector('.rule'), { scaleX: 0, duration: 1.4, ease: 'expo.out', delay: i * 0.08 })
          .from(p.querySelectorAll('.mask > *'), { yPercent: 110, duration: 1.2, ease: 'expo.out' }, '<0.15')
          .from(p.querySelector('p'), { autoAlpha: 0, y: 16, duration: 1, ease: 'power3.out' }, '<0.2');
      });

      return () => split.revert();
    });
  });

  return (
    <section ref={ref} id="univers" className="section universe" data-theme="light" aria-labelledby="univers-title">
      <div className="wrap">
        <div className="section__top">
          <span className="idx">(02) L’univers</span>
          <span className="demo-tag">Texte de démonstration</span>
        </div>
        <div className="manifesto-wrap">
          <h2 id="univers-title" className="eyebrow">L’art de la <b>transformation</b></h2>
          <p className="manifesto">{copy.manifesto}</p>
        </div>
      </div>

      <figure className="universe__visual">
        <Still src="stills/etude-06" alt="Étude 3D abstraite : mèches dorées qui s’enroulent sur fond noir." sizes="100vw" />
        <figcaption><span>Étude de matière n° 06</span><span className="demo-tag">Visuel de démonstration · rendu 3D</span></figcaption>
      </figure>

      <div className="wrap">
        <ul className="principles">
          {copy.universe.map((p, i) => (
            <li className="principle" key={p.k}>
              <span className="rule" aria-hidden="true" />
              <span className="idx">0{i + 1}</span>
              <h3 className="mask"><span>{p.k}</span></h3>
              <p>{p.v}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
