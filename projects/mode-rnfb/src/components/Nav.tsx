import { useEffect, useRef, useState } from 'react';
import { Phone } from 'lucide-react';
import { gsap, MQ, ScrollTrigger } from '../lib/gsap';
import { salon } from '../config/salon';
import { bookingTarget } from '../lib/booking';
import { Btn } from './Btn';

const links = [
  { id: 'univers', label: 'Univers' },
  { id: 'prestations', label: 'Prestations' },
  { id: 'galerie', label: 'Galerie' },
  { id: 'experience', label: 'Expérience' },
  { id: 'contact', label: 'Contact' },
];

const [first, ...rest] = salon.name.value.split(' ');

export function Nav() {
  const header = useRef<HTMLElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState<string | null>(null);
  const booking = bookingTarget();

  /* En-tête : se masque en descendant, réapparaît en remontant ; lien actif. */
  useEffect(() => {
    const h = header.current!;
    const reduce = matchMedia(MQ.reduce).matches;
    const st = ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        h.classList.toggle('is-solid', y > 40);
        const hide = !reduce && self.direction === 1 && y > 300;
        gsap.to(h, { yPercent: hide ? -100 : 0, duration: 0.5, ease: 'power3.out', overwrite: true });
      },
    });
    const sections = links.map(({ id }) => ScrollTrigger.create({
      trigger: `#${id}`, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => self.isActive && setCurrent(id),
      onLeaveBack: () => id === links[0].id && setCurrent(null),
    }));
    return () => { st.kill(); sections.forEach((s) => s.kill()); gsap.killTweensOf(h); };
  }, []);

  /* Menu plein écran (mobile) */
  useEffect(() => {
    const m = menu.current;
    if (!m) return;
    const reduce = matchMedia(MQ.reduce).matches;
    const items = m.querySelectorAll('.menu__links a, .menu__foot > *');
    const ctx = gsap.context(() => {
      if (open) {
        gsap.set(m, { visibility: 'visible' });
        gsap.to(m, { clipPath: 'inset(0 0 0% 0)', duration: reduce ? 0 : 0.9, ease: 'expo.inOut' });
        gsap.fromTo(items, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: reduce ? 0 : 1, ease: 'expo.out', stagger: 0.05, delay: reduce ? 0 : 0.35 });
        document.documentElement.style.overflow = 'hidden';
        (m.querySelector('a') as HTMLElement | null)?.focus({ preventScroll: true });
      } else {
        gsap.to(m, { clipPath: 'inset(0 0 100% 0)', duration: reduce ? 0 : 0.7, ease: 'expo.inOut', onComplete: () => { gsap.set(m, { visibility: 'hidden' }); } });
        document.documentElement.style.overflow = '';
      }
    }, m);
    const onKey = (e: KeyboardEvent) => {
      if (!open) return;
      if (e.key === 'Escape') { setOpen(false); button.current?.focus(); }
      if (e.key === 'Tab') {
        // Piège de focus simple entre le bouton Menu et le contenu du menu.
        const f = [button.current, ...Array.from(m.querySelectorAll<HTMLElement>('a'))].filter(Boolean) as HTMLElement[];
        const i = f.indexOf(document.activeElement as HTMLElement);
        if (e.shiftKey && i <= 0) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && i === f.length - 1) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => { ctx.revert(); document.removeEventListener('keydown', onKey); };
  }, [open]);

  /* Fermer le menu si l'écran passe en desktop */
  useEffect(() => {
    const mq = matchMedia('(min-width: 980px)');
    const onChange = () => mq.matches && setOpen(false);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return (
    <>
      <header ref={header} className="header">
        <div className="wrap header__in">
          <a className="wordmark" href="#top" aria-label={`${salon.name.value}, retour à l’accueil`} onClick={() => setOpen(false)}>
            {first} <i>{rest.join(' ')}</i>
          </a>
          <nav className="nav" aria-label="Navigation principale">
            {links.map((l) => <a key={l.id} href={`#${l.id}`} aria-current={current === l.id ? 'true' : undefined}>{l.label}</a>)}
          </nav>
          <div className="header__actions">
            {booking && (
              <Btn className="header__cta" href={booking.href} external={booking.external} icon={<Phone aria-hidden="true" />}>Rendez-vous</Btn>
            )}
            <button ref={button} className="menu-btn" type="button" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
              {open ? 'Fermer' : 'Menu'}
              <span className="menu-btn__icon" aria-hidden="true"><span /><span /></span>
            </button>
          </div>
        </div>
      </header>

      <div ref={menu} id="menu" className="menu" role="dialog" aria-modal="true" aria-label="Menu" aria-hidden={!open}>
        <nav className="menu__links" aria-label="Navigation mobile">
          {links.map((l, i) => (
            <a key={l.id} href={`#${l.id}`} onClick={() => setOpen(false)} tabIndex={open ? 0 : -1}>
              <span className="idx">0{i + 1}</span>{l.label}
            </a>
          ))}
        </nav>
        <div className="menu__foot">
          <p>{salon.activity.value} · {salon.city.value}, {salon.country.value}</p>
          {booking && (
            <a className="btn" href={booking.href} tabIndex={open ? 0 : -1} onClick={() => setOpen(false)}>
              <span className="btn__label">Prendre rendez-vous</span><Phone aria-hidden="true" />
            </a>
          )}
        </div>
      </div>
    </>
  );
}
