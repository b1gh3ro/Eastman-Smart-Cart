import Icon from './Icon';

// − count + pill. The server has the final say on limits; these bounds just stop obvious bad requests.
export default function QuantityStepper({
  value,
  min = 1,
  max = 10,
  disabled,
  onChange,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  disabled?: boolean;
  onChange: (next: number) => void;
  label: string;
}) {
  const button =
    'flex h-10 w-10 items-center justify-center rounded-lg text-on-surface transition-colors hover:bg-surface-container-high active:scale-95 disabled:cursor-not-allowed disabled:opacity-40';
  return (
    <div className="inline-flex items-center rounded-xl bg-[#f1f5f9] p-0.5" role="group" aria-label={label}>
      <button type="button" className={button} aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => onChange(value - 1)}>
        <Icon name="remove" className="text-[18px]" />
      </button>
      <span className="tabular w-8 text-center font-medium" aria-live="polite">
        {value}
      </span>
      <button type="button" className={button} aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)}>
        <Icon name="add" className="text-[18px]" />
      </button>
    </div>
  );
}
