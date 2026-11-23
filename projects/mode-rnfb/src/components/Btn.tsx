import { useRef, type ReactNode } from 'react';
import { useMagnetic } from '../lib/useMagnetic';

interface Props {
  href: string;
  variant?: 'solid' | 'line';
  icon?: ReactNode;
  children: ReactNode;
  external?: boolean;
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

/** Lien-bouton avec remplissage au survol et attraction magnétique (pointeur fin). */
export function Btn({ href, variant = 'solid', icon, children, external, className = '', onClick, ariaLabel }: Props) {
  const ref = useRef<HTMLAnchorElement>(null);
  useMagnetic(ref);
  return (
    <a
      ref={ref}
      href={href}
      className={`btn btn--${variant} ${className}`}
      onClick={onClick}
      aria-label={ariaLabel}
      {...(external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
    >
      <span className="btn__label">{children}</span>
      {icon}
    </a>
  );
}
