import { useRef } from 'react';
import { gsap, MQ, useGsap } from '../lib/gsap';
import { salon, copy } from '../config/salon';

const [first, ...rest] = salon.name.value.split(' ');

export function Footer() {
  const ref = useRef<HTMLElement>(null);

  useGsap(ref, (mm) => {
    mm.add(MQ.motion, () => {
      gsap.from('.footer__mark .ch', {
        yPercent: 100, ease: 'none', stagger: 0.06,
        scrollTrigger: { trigger: '.footer__mark', start: 'top bottom', end: 'bottom bottom', scrub: 0.6 },
      });
    });
  });

  const top = () => {
    const reduce = matchMedia(MQ.reduce).matches;
    window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    document.getElementById('top')?.focus({ preventScroll: true });
  };

  return (
    <footer ref={ref} className="footer" data-theme="dark">
      <div className="wrap">
        <div className="footer__top">
          <p className="footer__tag">{copy.tagline}.</p>
          <nav className="footer__nav" aria-label="Pied de page">
            <a className="link" href="#univers">Univers</a>
            <a className="link" href="#prestations">Prestations</a>
            <a className="link" href="#galerie">Galerie</a>
            <a className="link" href="#contact">Contact</a>
          </nav>
        </div>
        <p className="footer__mark" aria-hidden="true">
          {[...first].map((c, i) => <span className="ch" key={`a${i}`}>{c}</span>)}
          <span className="ch">&nbsp;</span>
          {[...rest.join(' ')].map((c, i) => <i className="ch" key={`b${i}`}>{c}</i>)}
        </p>
        <div className="footer__base">
          <span>© {new Date().getFullYear()} {salon.name.value} · {salon.activity.value} à {salon.city.value}</span>
          <span>Site de démonstration · visuels : rendus 3D non contractuels</span>
          <button type="button" onClick={top}>Retour en haut ↑</button>
        </div>
      </div>
    </footer>
  );
}
