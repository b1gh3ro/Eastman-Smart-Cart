// The blue cart mark from the design.
export default function Logo({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} role="img" aria-label="Eastman Smart Cart">
      <rect width="40" height="40" rx="10" fill="#2563eb" />
      <path
        d="M9 11h3.2l2.6 12.2a2 2 0 0 0 2 1.6h10.1a2 2 0 0 0 1.9-1.4L31 15H14"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="17.5" cy="29.5" r="2" fill="#fff" />
      <circle cx="26.5" cy="29.5" r="2" fill="#fff" />
    </svg>
  );
}
