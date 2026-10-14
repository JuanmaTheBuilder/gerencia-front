import type { InputHTMLAttributes, ReactNode } from 'react';

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement> {
  label: string;
  error?: string;
  children?: ReactNode;
}

export default function FormField({ label, error, children, ...props }: FormFieldProps) {
  return (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children || <input {...props} className={`w-full ${props.className || ''}`} />}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
