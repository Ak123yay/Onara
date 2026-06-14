"use client";

import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";

type PasswordInputProps = {
  autoComplete: string;
  id: string;
  minLength?: number;
  onChange: (value: string) => void;
  placeholder: string;
  required?: boolean;
  value: string;
};

export function PasswordInput({
  autoComplete,
  id,
  minLength,
  onChange,
  placeholder,
  required = false,
  value,
}: PasswordInputProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="auth-password-input">
      <input
        className="input"
        id={id}
        type={isVisible ? "text" : "password"}
        autoComplete={autoComplete}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        minLength={minLength}
      />
      <button
        aria-label={isVisible ? "Hide password" : "Show password"}
        aria-pressed={isVisible}
        className="auth-password-toggle"
        type="button"
        onClick={() => setIsVisible((current) => !current)}
      >
        {isVisible ? <EyeOff size={15} aria-hidden="true" /> : <Eye size={15} aria-hidden="true" />}
        <span>{isVisible ? "Hide" : "Show"}</span>
      </button>
    </div>
  );
}
