import type { InputHTMLAttributes } from "react";

export interface FormInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  label: string;
  helperText?: string;
  onValueChange: (value: string) => void;
}

export function FormInput({
  label,
  helperText,
  id,
  onValueChange,
  className = "",
  ...inputProps
}: FormInputProps) {
  const inputId = id ?? `field-${label.replace(/\s+/g, "-").toLowerCase()}`;

  return (
    <div className="flex w-full flex-col gap-2">
      <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
        {label}
      </label>
      <input
        id={inputId}
        type="number"
        inputMode="numeric"
        onChange={(event) => onValueChange(event.target.value)}
        className={`w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base text-neutral-900 outline-none focus:border-brand-primary focus:ring-2 focus:ring-brand-primary/20 ${className}`}
        {...inputProps}
      />
      {helperText ? (
        <p className="text-xs text-neutral-500">{helperText}</p>
      ) : null}
    </div>
  );
}
