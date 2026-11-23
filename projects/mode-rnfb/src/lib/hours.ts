import type { OpeningDay } from '../config/salon';

/** Jour et minute actuels à Bruxelles, quel que soit le fuseau du visiteur. */
export function brusselsNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Brussels', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? '0';
  return {
    day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(get('weekday')),
    minutes: Number(get('hour')) * 60 + Number(get('minute')),
  };
}

const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
export const fmtTime = (s: string) => { const [h, m] = s.split(':'); return `${Number(h)}h${m === '00' ? '' : m}`; };

export function openStatus(days: OpeningDay[], now = brusselsNow()) {
  const byDay = new Map(days.map((d) => [d.day, d]));
  const today = byDay.get(now.day);
  if (today?.open) {
    const [o, c] = today.open.map(toMin);
    if (now.minutes >= o && now.minutes < c) return { open: true, label: `Ouvert · jusqu’à ${fmtTime(today.open[1])}` };
    if (now.minutes < o) return { open: false, label: `Fermé · ouvre à ${fmtTime(today.open[0])}` };
  }
  for (let i = 1; i <= 7; i++) {
    const d = byDay.get((now.day + i) % 7);
    if (d?.open) return { open: false, label: `Fermé · ouvre ${i === 1 ? 'demain' : d.label.toLowerCase()} à ${fmtTime(d.open[0])}` };
  }
  return { open: false, label: 'Fermé' };
}
