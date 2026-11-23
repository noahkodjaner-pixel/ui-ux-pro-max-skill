import { useEffect, useRef, useState } from 'react';
import { gsap, MQ, SplitText, useGsap } from '../lib/gsap';
import { services } from '../config/salon';
import { Still, stillSrc } from '../lib/Still';

export function Services() {
  const ref = useRef<HTMLElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<number | null>(null);
  const hasDemo = services.some((s) => s.status === 'demo');

  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      const split = SplitText.create(el.querySelector('.services__title'), { type: 'words,chars', charsClass: 'ch', mask: 'chars' });
      gsap.from(split.chars, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.035, scrollTrigger: { trigger: '.services__title', start: 'top 82%' } });

      gsap.utils.toArray<HTMLElement>('.svc').forEach((row) => {
        const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 88%' } });
        tl.from(row.querySelector('.rule'), { scaleX: 0, transformOrigin: 'left', duration: 1.5, ease: 'expo.out' })
          .from(row.querySelector('.svc__name-i'), { yPercent: 105, duration: 1.2, ease: 'expo.out' }, 0.1)
          .from(row.querySelectorAll('.svc__n, .svc__desc, .svc__price, .svc__thumb'), { autoAlpha: 0, y: 14, duration: 1, ease: 'power3.out', stagger: 0.06 }, 0.25);
      });
      return () => split.revert();
    });
  });

  /* Aperçu photo qui suit le curseur (pointeur fin uniquement) */
  useEffect(() => {
    const p = previewRef.current;
    const list = ref.current?.querySelector<HTMLElement>('.svc-list');
    if (!p || !list || !matchMedia(MQ.fine).matches) return;
    const reduce = matchMedia(MQ.reduce).matches;
    const xTo = gsap.quickTo(p, 'x', { duration: reduce ? 0 : 0.7, ease: 'power3.out' });
    const yTo = gsap.quickTo(p, 'y', { duration: reduce ? 0 : 0.7, ease: 'power3.out' });
    const move = (e: PointerEvent) => { xTo(e.clientX + 28); yTo(e.clientY - p.offsetHeight / 2); };
    const enter = (e: PointerEvent) => {
      gsap.set(p, { x: e.clientX + 28, y: e.clientY - p.offsetHeight / 2 });
      gsap.to(p, { clipPath: 'inset(0% 0% 0% 0%)', duration: reduce ? 0 : 0.7, ease: 'expo.out' });
    };
    const leave = () => { gsap.to(p, { clipPath: 'inset(50% 50% 50% 50%)', duration: reduce ? 0 : 0.5, ease: 'expo.inOut' }); setActive(null); };
    list.addEventListener('pointermove', move);
    list.addEventListener('pointerenter', enter);
    list.addEventListener('pointerleave', leave);
    return () => {
      list.removeEventListener('pointermove', move);
      list.removeEventListener('pointerenter', enter);
      list.removeEventListener('pointerleave', leave);
      gsap.killTweensOf(p);
    };
  }, []);

  return (
    <section ref={ref} id="prestations" className="section services" data-theme="sand" aria-labelledby="prestations-title">
      <div className="wrap">
        <div className="section__top">
          <span className="idx">(03) Savoir-faire</span>
          {hasDemo && <span className="demo-tag">Carte de démonstration</span>}
        </div>
        <div className="services__head">
          <h2 id="prestations-title" className="services__title display">Prestations</h2>
          {hasDemo && (
            <p className="notice">
              Catégories indicatives. La carte réelle du salon, et ses tarifs s’il souhaite les afficher, prendront place ici.
            </p>
          )}
        </div>

        <ol className="svc-list">
          {services.map((s, i) => (
            <li className="svc" key={s.id} onPointerEnter={() => setActive(i)}>
              <span className="rule" aria-hidden="true" />
              <span className="svc__n idx">({String(i + 1).padStart(2, '0')})</span>
              <h3 className="svc__name"><span className="mask"><span className="svc__name-i">{s.name}</span></span></h3>
              <p className="svc__desc">{s.description}</p>
              {s.price && <span className="svc__price">{s.price}</span>}
              <div className="svc__thumb" aria-hidden="true"><Still src={s.image} alt="" sizes="74px" /></div>
            </li>
          ))}
        </ol>
      </div>

      <div ref={previewRef} className="svc-preview" aria-hidden="true">
        {services.map((s, i) => (
          <img key={s.id} src={stillSrc(s.image, 800)} alt="" className={active === i ? 'is-on' : ''} loading="lazy" decoding="async" />
        ))}
      </div>
    </section>
  );
}
