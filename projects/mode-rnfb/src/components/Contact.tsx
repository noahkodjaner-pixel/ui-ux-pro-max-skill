import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, MapPin, Phone } from 'lucide-react';
import { gsap, MQ, SplitText, useGsap } from '../lib/gsap';
import { salon, isShown } from '../config/salon';
import { bookingTarget } from '../lib/booking';
import { brusselsNow, fmtTime, openStatus } from '../lib/hours';
import { Btn } from './Btn';

export function Contact() {
  const ref = useRef<HTMLElement>(null);
  const booking = bookingTarget();
  const phoneShown = isShown(salon.phone.status) && !!salon.phone.value.href;
  const hoursShown = isShown(salon.hours.status);
  const ratingShown = isShown(salon.googleRating.status);
  const [now, setNow] = useState(() => brusselsNow());

  useEffect(() => {
    const id = window.setInterval(() => setNow(brusselsNow()), 60_000);
    return () => window.clearInterval(id);
  }, []);
  const status = openStatus(salon.hours.value, now);

  useGsap(ref, (mm, el) => {
    mm.add(MQ.motion, () => {
      const split = SplitText.create(el.querySelector('.contact__title'), { type: 'words,chars', charsClass: 'ch', mask: 'chars' });
      gsap.from(split.chars, { yPercent: 105, duration: 1.3, ease: 'expo.out', stagger: 0.03, scrollTrigger: { trigger: '.contact__title', start: 'top 85%' } });
      gsap.from(el.querySelectorAll('.contact__grid > *'), {
        y: 40, autoAlpha: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1,
        scrollTrigger: { trigger: '.contact__grid', start: 'top 82%' },
      });
      return () => split.revert();
    });
  });

  return (
    <section ref={ref} id="contact" className="section contact" data-theme="graphite" aria-labelledby="contact-title">
      <div className="wrap">
        <div className="section__top">
          <span className="idx">(06) Informations</span>
          {hoursShown && <span className="idx">{status.label}</span>}
        </div>
        <h2 id="contact-title" className="contact__title display">Venir <em>au salon</em></h2>

        <div className="contact__grid">
          <dl className="info">
            <div className="info__row">
              <dt>Adresse</dt>
              <dd>
                {salon.street.value && isShown(salon.street.status) ? `${salon.street.value}, ` : ''}{salon.postalCode.value} {salon.city.value}
                <small>{salon.country.value}{!salon.street.value && ' · adresse exacte communiquée prochainement'}</small>
                <a className="link" href={salon.mapsUrl} target="_blank" rel="noopener noreferrer">
                  <MapPin aria-hidden="true" />Ouvrir dans Google Maps<ArrowUpRight aria-hidden="true" />
                </a>
              </dd>
            </div>
            {phoneShown && (
              <div className="info__row">
                <dt>Téléphone</dt>
                <dd><a href={salon.phone.value.href}>{salon.phone.value.display}</a></dd>
              </div>
            )}
            {ratingShown && (
              <a className="rating" href={salon.mapsUrl} target="_blank" rel="noopener noreferrer">
                <b>{salon.googleRating.value.score}</b>
                <span>Note moyenne sur Google<br />{salon.googleRating.value.count} avis · relevé le {salon.googleRating.value.date}</span>
              </a>
            )}
          </dl>

          {hoursShown && (
            <div>
              <p className={`status ${status.open ? '' : 'is-closed'}`}><i aria-hidden="true" />{status.label}</p>
              <ul className="hours" aria-label="Horaires d’ouverture">
                {salon.hours.value.map((d) => (
                  <li key={d.day} aria-current={d.day === now.day ? 'date' : undefined}>
                    <span>{d.label}</span>
                    <span>{d.open ? `${fmtTime(d.open[0])} – ${fmtTime(d.open[1])}` : 'Fermé'}</span>
                  </li>
                ))}
              </ul>
              {salon.hours.status === 'source-google' && <p className="source">Horaires issus de la fiche Google du salon, à confirmer.</p>}
            </div>
          )}

          <div className="book-card">
            <span className="idx">Rendez-vous</span>
            <h3>Réserver <em>votre moment</em></h3>
            {salon.bookingUrl.value ? (
              <p>Choisissez votre créneau directement en ligne.</p>
            ) : (
              <p>
                <span className="demo-tag" style={{ marginRight: '.5rem' }}>Démo</span>
                La réservation en ligne sera connectée à l’outil du salon. En attendant, un simple appel suffit.
              </p>
            )}
            <div className="book-card__actions">
              {booking && (
                <Btn href={booking.href} external={booking.external} icon={booking.external ? <ArrowUpRight aria-hidden="true" /> : <Phone aria-hidden="true" />}>
                  {booking.external ? 'Réserver en ligne' : 'Appeler le salon'}
                </Btn>
              )}
              <Btn href={salon.mapsUrl} variant="line" external icon={<MapPin aria-hidden="true" />}>Itinéraire</Btn>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
