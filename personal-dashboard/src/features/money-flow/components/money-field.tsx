import type { ReactNode } from "react";

export function MoneyField({
  label,
  htmlFor,
  children,
}: Readonly<{
  label: string;
  htmlFor?: string;
  children: ReactNode;
}>) {
  return (
    <div className="space-y-2">
      {htmlFor ? (
        <label htmlFor={htmlFor} className="text-sm font-medium">
          {label}
        </label>
      ) : (
        <p className="text-sm font-medium">{label}</p>
      )}
      {children}
    </div>
  );
}
