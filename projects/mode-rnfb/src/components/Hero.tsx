import { useEffect, useRef, useState } from 'react';
import { ArrowDownRight, Phone } from 'lucide-react';
import { gsap, ScrollTrigger, MQ, useGsap } from '../lib/gsap';
import { salon, copy } from '../config/salon';
import { bookingTarget } from '../lib/booking';
import { Still } from '../lib/Still';
import { Btn } from './Btn';
import type { RibbonField } from '../three/RibbonField';

const [first, ...rest] = salon.name.value.split(' ');
const second = rest.join(' ');

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const field = useRef<RibbonField | null>(null);
  const [webgl, setWebgl] = useState(false);
  const booking = bookingTarget();

  /* ---------- Scène 3D : chargée après le premier rendu, jamais bloquante ---------- */
  useEffect(() => {
    const hero = ref.current;
    const canvas = canvasRef.current;
    if (!hero || !canvas) return;
    let cancelled = false;
    let teardown = () => {};

    const init = async () => {
      const mod = await import('../three/RibbonField');
      if (cancelled || !mod.supportsWebGL()) return;
      const mobile = matchMedia('(max-width: 899px)').matches;
      const reduce = matchMedia(MQ.reduce).matches;
      let f: RibbonField;
      try {
        f = new mod.RibbonField(canvas, {
          count: mobile ? 80 : 150,
          segments: mobile ? 150 : 240,
          maxDpr: mobile ? 1.5 : 2,
          palette: mod.defaultPalette,
          background: null,
          fog: '#101010',
          seed: 7,
          width: mobile ? 0.055 : 0.045,
          tilt: -0.35,
          camera: { x: 0, y: 0, z: 9, fov: 35 },
          pointer: matchMedia(MQ.fine).matches,
        });
      } catch {
        return; // contexte WebGL refusé : l'affiche statique reste en place
      }
      field.current = f;
      f.setTime(4);
      if (reduce) { f.setSpeed(0); f.jumpMorph(0.2); }
      f.renderOnce();

      let visible = true;
      const sync = () => {
        if (reduce) return f.renderOnce();
        if (visible && !document.hidden) f.start(); else f.stop();
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
      io.observe(hero);
      const ro = new ResizeObserver(() => { f.resize(); if (reduce) f.renderOnce(); });
      ro.observe(canvas);
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        f.setPointer((e.clientX / innerWidth) * 2 - 1, -((e.clientY / innerHeight) * 2 - 1));
      };
      const onLeave = () => f.pointerLeave();
      hero.addEventListener('pointermove', onMove);
      hero.addEventListener('pointerleave', onLeave);
      document.addEventListener('visibilitychange', sync);
      requestAnimationFrame(() => !cancelled && setWebgl(true));

      teardown = () => {
        io.disconnect(); ro.disconnect();
        hero.removeEventListener('pointermove', onMove);
        hero.removeEventListener('pointerleave', onLeave);
        document.removeEventListener('visibilitychange', sync);
        f.dispose();
        field.current = null;
      };
    };

    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => void init(), { timeout: 700 })
      : window.setTimeout(() => void init(), 250);
    return () => {
      cancelled = true;
      if (window.cancelIdleCallback) window.cancelIdleCallback(idle); else window.clearTimeout(idle);
      teardown();
    };
  }, []);

  /* ---------- Entrée + transformation au scroll ---------- */
  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
      tl.from('.hero__title .ch', { yPercent: 118, rotate: 5, duration: 1.6, stagger: 0.06 })
        .from('[data-fade]', { y: 22, autoAlpha: 0, duration: 1.2, stagger: 0.07 }, 0.6)
        .from('.hero__shade', { opacity: 0, duration: 1.8 }, 0);
    });

    // Desktop : le hero reste épinglé le temps de la transformation des mèches.
    mm.add(MQ.desktop, () => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'top top',
          end: '+=110%',
          pin: true,
          scrub: 0.6,
          onUpdate: (s) => { field.current?.setMorph(s.progress); field.current?.setScrollTilt(s.progress); },
        },
      });
      tl.to('.hero__title', { yPercent: -10, scale: 0.94, transformOrigin: '0% 100%', ease: 'none', duration: 1 }, 0)
        .to('.hero__bottom', { autoAlpha: 0, y: -40, ease: 'none', duration: 0.35 }, 0)
        .to('.hero__state-v .a', { yPercent: -110, ease: 'power2.inOut', duration: 0.12 }, 0.44)
        .fromTo('.hero__state-v .b', { yPercent: 110 }, { yPercent: 0, ease: 'power2.inOut', duration: 0.12 }, 0.44);
    });

    // Mobile : pas d'épinglage, la transformation suit simplement le défilement.
    mm.add(MQ.mobile, () => {
      ScrollTrigger.create({
        trigger: el, start: 'top top', end: 'bottom top', scrub: true,
        onUpdate: (s) => field.current?.setMorph(Math.min(1, s.progress * 1.4)),
      });
      gsap.to('.hero__title', { yPercent: 22, ease: 'none', scrollTrigger: { trigger: el, start: 'top top', end: 'bottom top', scrub: true } });
    });
  });

  return (
    <section ref={ref} id="top" tabIndex={-1} className={`hero ${webgl ? 'is-webgl' : ''}`} data-theme="dark" aria-labelledby="hero-title">
      <div className="hero__media" aria-hidden="true">
        <Still src="stills/hero" alt="" priority className="hero__poster" sizes="100vw" />
        <canvas ref={canvasRef} />
      </div>
      <div className="hero__shade" aria-hidden="true" />

      <div className="wrap hero__in">
        <div className="hero__meta">
          <p className="eyebrow" data-fade>{salon.activity.value} · {salon.city.value}, BE</p>
          <p className="hero__state" data-fade aria-hidden="true">
            <span className="idx">(01) Transformation</span>
            <span className="hero__state-v"><span className="a">Mouvement</span><span className="b" style={{ transform: 'translateY(110%)' }}>Ligne</span></span>
          </p>
        </div>

        <h1 id="hero-title" className="hero__title display" aria-label={salon.name.value}>
          <span className="row" aria-hidden="true">{[...first].map((c, i) => <span className="ch" key={i}>{c}</span>)}</span>
          {second && <span className="row row--2" aria-hidden="true">{[...second].map((c, i) => <span className="ch" key={i}>{c}</span>)}</span>}
        </h1>

        <div className="hero__bottom">
          <div className="hero__bottom-text">
            <p className="hero__tag" data-fade>{copy.tagline}</p>
            <p className="hero__lead" data-fade>{copy.heroLead}</p>
          </div>
          <div className="hero__ctas" data-fade>
            <Btn href="#univers" icon={<ArrowDownRight aria-hidden="true" />}>Découvrir le salon</Btn>
            {booking && (
              <Btn href={booking.href} variant="line" external={booking.external} icon={<Phone aria-hidden="true" />}>
                {booking.label}
              </Btn>
            )}
          </div>
          <a className="scroll-cue" href="#univers" data-fade aria-label="Faire défiler vers l’univers du salon">
            <span className="scroll-cue__line" aria-hidden="true" />Défiler
          </a>
        </div>
      </div>
    </section>
  );
}
