import { useNumericInput } from '../../hooks';

interface FormNumericInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  className?: string;
}

export function FormNumericInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  precision = 2,
  className = '',
}: FormNumericInputProps) {
  const { inputValue, handleChange, handleBlur, handleKeyDown } = useNumericInput({
    value,
    onChange,
    min,
    max,
    step,
    precision,
  });

  return (
    <div className={className}>
      <label className="text-xs text-ink-secondary">{label}</label>
      <div className="flex items-center">
        <input
          type="number"
          value={inputValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          className="w-full px-2 py-1 text-sm border border-line rounded bg-paper focus:outline-none focus:ring-1 focus:ring-teal"
        />
        {unit && <span className="ml-1 text-xs text-ink-faint">{unit}</span>}
      </div>
    </div>
  );
}
