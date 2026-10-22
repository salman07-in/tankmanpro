import React, { useState } from 'react';

export type IllustrationKind =
  | 'water-tank'
  | 'bathroom'
  | 'kitchen'
  | 'ac-service'
  | 'sofa-mattress'
  | 'vehicle-wash'
  | 'fan-appliances'
  | 'aesthetics'
  | 'appliance-repair'
  | 'plumbing'
  | 'hero';

interface IllustrationProps {
  kind: IllustrationKind;
  className?: string;
}

interface ServicePhotoProps {
  src?: string;
  alt: string;
  fallbackKind?: IllustrationKind;
  className?: string;
  imgClassName?: string;
}

/**
 * Renders an authentic service photograph from /assets/tankmanpro/* with
 * a zero-broken-image guarantee (graceful fallback to ServiceIllustration).
 */
export const ServicePhoto: React.FC<ServicePhotoProps> = ({
  src,
  alt,
  fallbackKind = 'water-tank',
  className = '',
  imgClassName = 'w-full h-full object-cover',
}) => {
  const [hasError, setHasError] = useState(false);

  if (!src || hasError) {
    return <ServiceIllustration kind={fallbackKind} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden bg-slate-100 ${className}`}>
      <img
        src={src}
        alt={alt}
        loading="lazy"
        onError={() => setHasError(true)}
        className={imgClassName}
      />
    </div>
  );
};

/**
 * Bespoke technical illustrations for TankmanPro services as fallback.
 */
export const ServiceIllustration: React.FC<IllustrationProps> = ({ kind, className = '' }) => {
  if (kind === 'hero') {
    return (
      <div
        className={`relative overflow-hidden bg-slate-50 text-slate-900 select-none flex flex-col justify-between p-6 ${className}`}
        role="img"
        aria-label="TankmanPro home services showcase"
      >
        <div className="grid grid-cols-2 gap-3 h-full">
          <ServicePhoto
            src="/assets/tankmanpro/water-tank.jpg"
            alt="Mechanized Water Tank Cleaning"
            className="rounded-xl h-44"
          />
          <ServicePhoto
            src="/assets/tankmanpro/ac-service.jpg"
            alt="AC Service and Repair"
            className="rounded-xl h-44"
          />
          <ServicePhoto
            src="/assets/tankmanpro/kitchen-chimney.png"
            alt="Kitchen and Chimney Deep Cleaning"
            className="rounded-xl h-44"
          />
          <ServicePhoto
            src="/assets/tankmanpro/bathroom-deep.jpg"
            alt="Bathroom Deep Cleaning"
            className="rounded-xl h-44"
          />
        </div>
      </div>
    );
  }

  const labelMap: Record<IllustrationKind, string> = {
    'water-tank': 'Mechanized Water Tank Cleaning',
    bathroom: 'Bathroom & Tile Scrubbing',
    kitchen: 'Kitchen, Chimney & Fridge Cleaning',
    'ac-service': 'Split & Window AC Service',
    'sofa-mattress': 'Sofa, Mattress & Carpet Shampooing',
    'vehicle-wash': 'Doorstep Car & Bike Wash',
    'fan-appliances': 'Fan, Exhaust & Floor Care',
    aesthetics: 'Beedare At-Home Skin & Aesthetics',
    'appliance-repair': 'Appliance & Fixture Deep Care',
    plumbing: 'Sanitization & Hygiene Care',
    hero: 'TankmanPro Home Services',
  };

  return (
    <div
      className={`relative overflow-hidden bg-slate-100 flex items-center justify-center p-4 select-none ${className}`}
      role="img"
      aria-label={labelMap[kind] || 'TankmanPro Service'}
    >
      <div className="text-center">
        <div className="text-xs font-bold text-slate-700">{labelMap[kind]}</div>
        <div className="text-[11px] text-slate-500 mt-0.5">TankmanPro Verified Service</div>
      </div>
    </div>
  );
};
