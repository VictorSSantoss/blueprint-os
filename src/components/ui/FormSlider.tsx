import { useNumericInput } from '../../hooks';

interface FormSliderProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  className?: string;
}

export function FormSlider({
  label,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  className = '',
}: FormSliderProps) {
  const { inputValue, handleChange, handleBlur, handleKeyDown } = useNumericInput({
    value,
    onChange,
    min,
    max,
    step,
    precision: 0,
  });

  return (
    <div className={className}>
      <label className="text-xs font-medium text-ink-secondary uppercase mb-2">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="flex-1 accent-teal"
        />
        <div className="flex items-center w-16">
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
    </div>
  );
}
