import { useLayoutEffect } from 'react';
import { gsap, MQ, ScrollTrigger } from './lib/gsap';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Universe } from './components/Universe';
import { Services } from './components/Services';
import { Gallery } from './components/Gallery';
import { Experience } from './components/Experience';
import { Contact } from './components/Contact';
import { Footer } from './components/Footer';

/** Palette de chaque séquence : l'arrière-plan de la page glisse de l'une à l'autre. */
const themes: Record<string, { bg: string; fg: string; muted: string; line: string; accent: string }> = {
  dark: { bg: '#101010', fg: '#F2EEE8', muted: 'rgba(242,238,232,.62)', line: 'rgba(242,238,232,.16)', accent: '#C7AC83' },
  graphite: { bg: '#272727', fg: '#F2EEE8', muted: 'rgba(242,238,232,.66)', line: 'rgba(242,238,232,.18)', accent: '#C7AC83' },
  light: { bg: '#F2EEE8', fg: '#101010', muted: 'rgba(16,16,16,.66)', line: 'rgba(16,16,16,.16)', accent: '#6E5B3D' },
  sand: { bg: '#E7DED0', fg: '#101010', muted: 'rgba(16,16,16,.68)', line: 'rgba(16,16,16,.17)', accent: '#6E5B3D' },
};

export default function App() {
  useLayoutEffect(() => {
    const root = document.documentElement;
    const reduce = matchMedia(MQ.reduce).matches;
    const apply = (name: string) => {
      const t = themes[name] ?? themes.dark;
      gsap.to(root, {
        '--bg': t.bg, '--fg': t.fg, '--muted': t.muted, '--line': t.line, '--accent': t.accent,
        duration: reduce ? 0 : 0.9, ease: 'power2.out', overwrite: true,
      });
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', t.bg);
    };
    const triggers = gsap.utils.toArray<HTMLElement>('[data-theme]').map((el) => ScrollTrigger.create({
      trigger: el, start: 'top 50%', end: 'bottom 50%',
      onToggle: (self) => self.isActive && apply(el.dataset.theme!),
    }));
    // Les images et polices modifient les hauteurs : on recalcule une fois tout chargé.
    const refresh = () => ScrollTrigger.refresh();
    window.addEventListener('load', refresh);
    document.fonts?.ready.then(refresh);
    return () => { triggers.forEach((t) => t.kill()); window.removeEventListener('load', refresh); };
  }, []);

  return (
    <>
      <a className="skip" href="#main">Aller au contenu</a>
      <Nav />
      <main id="main">
        <Hero />
        <Universe />
        <Services />
        <Gallery />
        <Experience />
        <Contact />
      </main>
      <Footer />
      <div className="grain" aria-hidden="true" />
    </>
  );
}
