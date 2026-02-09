"use client";

import { useState } from "react";

type CountedInputProps = {
  name: string;
  defaultValue?: string;
  maxLength?: number;
  required?: boolean;
  placeholder?: string;
  type?: string;
  hint?: string;
  className?: string;
};

export function CountedInput({
  name,
  defaultValue,
  maxLength,
  required,
  placeholder,
  type = "text",
  hint,
  className,
}: CountedInputProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className={className}>
      <input
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        type={type}
      />
      {(hint || maxLength) && (
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
          <span>{hint ?? " "}</span>
          {maxLength ? (
            <span>
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}

type CountedTextareaProps = {
  name: string;
  defaultValue?: string;
  maxLength?: number;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  hint?: string;
  className?: string;
};

export function CountedTextarea({
  name,
  defaultValue,
  maxLength,
  required,
  placeholder,
  rows = 3,
  hint,
  className,
}: CountedTextareaProps) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div className={className}>
      <textarea
        className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm"
        name={name}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        maxLength={maxLength}
        required={required}
        placeholder={placeholder}
        rows={rows}
      />
      {(hint || maxLength) && (
        <div className="mt-1 flex items-center justify-between text-[11px] text-muted">
          <span>{hint ?? " "}</span>
          {maxLength ? (
            <span>
              {value.length}/{maxLength}
            </span>
          ) : null}
        </div>
      )}
    </div>
  );
}
