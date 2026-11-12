"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Field } from "./planner-form";

export function ActivitySelect({
  label,
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly Readonly<{ id: string; name: string }>[];
  placeholder?: string;
  disabled?: boolean;
}>) {
  return (
    <Field label={label}>
      <Select value={value} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger className="w-full" aria-label={label}>
          <SelectValue placeholder={placeholder ?? "Choose an option"} />
        </SelectTrigger>
        <SelectContent>
          {options.map((item) => (
            <SelectItem key={item.id} value={item.id}>
              {item.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
