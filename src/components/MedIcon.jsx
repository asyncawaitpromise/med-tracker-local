import { getMedPhoto } from '../lib/medPhotos';

// Tailwind needs literal class names to detect at build time, so sizes are
// a fixed map rather than interpolated from a numeric prop.
const SIZES = {
  sm: { box: 'w-4 h-4', text: 'text-[11px]' },
  md: { box: 'w-8 h-8', text: 'text-xl' },
};

// Renders a medication's icon, whether it's a photo or an emoji, at a
// consistent size.
export default function MedIcon({ medication, size = 'md', className = '' }) {
  const { box, text } = SIZES[size] ?? SIZES.md;

  if (medication.iconType === 'emoji') {
    return (
      <span
        className={`${box} ${text} inline-flex items-center justify-center leading-none shrink-0 ${className}`}
      >
        {medication.emoji}
      </span>
    );
  }

  return (
    <img
      src={getMedPhoto(medication.icon).file}
      alt=""
      className={`${box} rounded object-cover shrink-0 ${className}`}
    />
  );
}
