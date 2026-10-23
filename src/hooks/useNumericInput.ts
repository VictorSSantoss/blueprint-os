import { useState, useCallback, useEffect } from 'react';

export interface UseNumericInputOptions {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  precision?: number;
  allowNegative?: boolean;
}

export interface UseNumericInputReturn {
  inputValue: string;
  handleChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleBlur: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export function useNumericInput({
  value,
  onChange,
  min,
  max,
  step = 1,
  precision = 2,
  allowNegative = true,
}: UseNumericInputOptions): UseNumericInputReturn {
  const [inputValue, setInputValue] = useState(() => formatValue(value, precision));
  const [isFocused, setIsFocused] = useState(false);

  // Sync input value with external value when not focused
  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatValue(value, precision));
    }
  }, [value, precision, isFocused]);

  const clampValue = useCallback(
    (val: number): number => {
      let result = val;
      if (!allowNegative && result < 0) {
        result = 0;
      }
      if (min !== undefined && result < min) {
        result = min;
      }
      if (max !== undefined && result > max) {
        result = max;
      }
      return result;
    },
    [min, max, allowNegative]
  );

  const commitValue = useCallback(
    (val: string) => {
      const parsed = parseFloat(val);
      if (isNaN(parsed)) {
        // Reset to current value
        setInputValue(formatValue(value, precision));
        return;
      }

      const clamped = clampValue(parsed);
      onChange(clamped);
      setInputValue(formatValue(clamped, precision));
    },
    [value, precision, onChange, clampValue]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;

      // Allow empty string, minus sign, and valid number patterns
      if (
        newValue === '' ||
        newValue === '-' ||
        newValue === '.' ||
        newValue === '-.' ||
        /^-?\d*\.?\d*$/.test(newValue)
      ) {
        setInputValue(newValue);
      }
    },
    []
  );

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    commitValue(inputValue);
  }, [inputValue, commitValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        commitValue(inputValue);
        (e.target as HTMLInputElement).blur();
        return;
      }

      if (e.key === 'Escape') {
        e.preventDefault();
        setInputValue(formatValue(value, precision));
        (e.target as HTMLInputElement).blur();
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        const current = parseFloat(inputValue) || 0;
        const newVal = clampValue(current + step);
        onChange(newVal);
        setInputValue(formatValue(newVal, precision));
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const current = parseFloat(inputValue) || 0;
        const newVal = clampValue(current - step);
        onChange(newVal);
        setInputValue(formatValue(newVal, precision));
        return;
      }
    },
    [inputValue, value, precision, step, onChange, clampValue, commitValue]
  );

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  return {
    inputValue,
    handleChange,
    handleBlur: () => {
      handleFocus(); // Track focus state
      handleBlur();
    },
    handleKeyDown,
  };
}

function formatValue(value: number, precision: number): string {
  if (Number.isInteger(value)) {
    return value.toString();
  }
  return value.toFixed(precision).replace(/\.?0+$/, '');
}
