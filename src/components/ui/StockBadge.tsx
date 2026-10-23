// "In stock", "Only 3 left" or "Out of stock", in the design's status colours.
export default function StockBadge({ stock, className = '' }: { stock: number; className?: string }) {
  const [dot, text, label] =
    stock <= 0
      ? ['bg-error', 'text-error', 'Out of stock']
      : stock <= 5
        ? ['bg-[#f59e0b]', 'text-warning', `Only ${stock} left`]
        : ['bg-tertiary', 'text-tertiary', 'In stock'];
  return (
    <span className={`inline-flex items-center gap-1.5 text-label-sm ${text} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label}
    </span>
  );
}
