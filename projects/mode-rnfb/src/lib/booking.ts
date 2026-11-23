import { salon, isShown } from '../config/salon';

/** Destination réelle de « Prendre rendez-vous », ou null s'il n'y en a pas. */
export function bookingTarget(): { href: string; label: string; external: boolean } | null {
  if (salon.bookingUrl.value && isShown(salon.bookingUrl.status)) {
    return { href: salon.bookingUrl.value, label: 'Prendre rendez-vous', external: true };
  }
  if (salon.phone.value.href && isShown(salon.phone.status)) {
    return { href: salon.phone.value.href, label: 'Prendre rendez-vous', external: false };
  }
  return null;
}
