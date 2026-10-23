// A Material Symbols icon (the icon set used by the design). Loaded in app/layout.tsx.
export default function Icon({ name, className = '', filled }: { name: string; className?: string; filled?: boolean }) {
  return (
    <span aria-hidden="true" className={`material-symbols-outlined ${filled ? 'icon-filled' : ''} ${className}`}>
      {name}
    </span>
  );
}
