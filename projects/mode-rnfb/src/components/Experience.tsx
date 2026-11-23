import { useRef } from 'react';
import { gsap, MQ, ScrollTrigger, useGsap } from '../lib/gsap';
import { copy } from '../config/salon';
import { Still } from '../lib/Still';

export function Experience() {
  const ref = useRef<HTMLElement>(null);
  const steps = copy.experience;

  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      gsap.from(el.querySelectorAll('.exp__title .mask > *'), {
        yPercent: 110, duration: 1.3, ease: 'expo.out', stagger: 0.08,
        scrollTrigger: { trigger: '.exp__title', start: 'top 85%' },
      });
    });

    mm.add('(min-width: 980px) and (prefers-reduced-motion: no-preference)', () => {
      el.classList.add('js-motion');
      const nums = gsap.utils.toArray<HTMLElement>('.exp__num span');
      const stepEls = gsap.utils.toArray<HTMLElement>('.step');
      gsap.set(nums, { yPercent: (i) => (i === 0 ? 0 : 110) });
      let current = 0;
      const show = (i: number) => {
        if (i === current) return;
        const dir = i > current ? 1 : -1;
        gsap.to(nums[current], { yPercent: -110 * dir, duration: 0.9, ease: 'expo.inOut' });
        gsap.fromTo(nums[i], { yPercent: 110 * dir }, { yPercent: 0, duration: 0.9, ease: 'expo.inOut' });
        stepEls[current].classList.remove('is-active');
        stepEls[i].classList.add('is-active');
        current = i;
      };
      stepEls[0].classList.add('is-active');
      stepEls.forEach((s, i) => ScrollTrigger.create({
        trigger: s, start: 'top 55%', end: 'bottom 55%',
        onToggle: (self) => self.isActive && show(i),
      }));

      // Carte photo : rotation 3D synchronisée à la progression des étapes.
      gsap.fromTo('.exp__card', { rotateY: -24, rotateX: 8, scale: 0.92 }, {
        rotateY: 18, rotateX: -6, scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.exp__steps', start: 'top 60%', end: 'bottom 60%', scrub: true },
      });
      gsap.fromTo('.exp__card img', { scale: 1.25 }, {
        scale: 1, ease: 'none',
        scrollTrigger: { trigger: '.exp__steps', start: 'top 60%', end: 'bottom 60%', scrub: true },
      });
      return () => { el.classList.remove('js-motion'); stepEls.forEach((s) => s.classList.remove('is-active')); };
    });
  });

  return (
    <section ref={ref} id="experience" className="section" data-theme="light" aria-labelledby="experience-title">
      <div className="wrap">
        <div className="section__top">
          <span className="idx">(05) L’expérience</span>
          <span className="demo-tag">Texte de démonstration</span>
        </div>
        <div className="exp">
          <div className="exp__aside">
            <h2 id="experience-title" className="exp__title display">
              <span className="mask"><span>Le temps</span></span>
              <span className="mask"><span><em>d’un rendez-vous</em></span></span>
            </h2>
            <div className="exp__stage" aria-hidden="true">
              <div className="exp__num">{steps.map((s) => <span key={s.n}>{s.n}</span>)}</div>
              <div className="exp__card"><Still src="stills/etude-05" alt="" sizes="300px" /></div>
            </div>
          </div>
          <ol className="exp__steps">
            {steps.map((s) => (
              <li className="step" key={s.n}>
                <span className="step__n" aria-hidden="true">{s.n}</span>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
