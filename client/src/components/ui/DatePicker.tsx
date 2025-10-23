import React from 'react';
import { Calendar } from 'lucide-react';
import { clsx } from 'clsx';

interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date',
  min,
  max,
  disabled = false,
  className,
  label,
  error,
  required = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={clsx('space-y-1', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <div className="relative">
        <input
          type="date"
          value={value || ''}
          onChange={handleChange}
          placeholder={placeholder}
          min={min}
          max={max}
          disabled={disabled}
          className={clsx(
            'input w-full pl-10',
            error && 'border-red-500 focus-visible:ring-red-500',
            disabled && 'bg-gray-50 cursor-not-allowed'
          )}
        />
        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
};
