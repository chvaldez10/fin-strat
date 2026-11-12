"use client";

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MoneyField as Field } from "../../components/money-field";

type ActivityOption = Readonly<{ id: string; name: string }>;

export function ActivitySelect({
  label,
  value,
  onChange,
  options,
  groups,
  placeholder,
  disabled,
}: Readonly<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly ActivityOption[];
  groups?: readonly Readonly<{
    label: string;
    options: readonly ActivityOption[];
  }>[];
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
          {groups
            ?.filter((group) => group.options.length > 0)
            .map((group) => (
              <SelectGroup key={group.label}>
                <SelectLabel>{group.label}</SelectLabel>
                {group.options.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectGroup>
            ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
