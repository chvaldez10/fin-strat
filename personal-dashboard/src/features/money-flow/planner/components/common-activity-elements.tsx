import { LayoutGrid } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_CATEGORIES, type ActivityCategory } from "../activity";
import type { ActivityCanvasView } from "../activity-projection";

const groups = [
  { view: "expenses", kind: "expense", label: "Expenses" },
  { view: "savings", kind: "savings", label: "Savings" },
] as const;

export function CommonActivityElements({
  view,
  onSelect,
}: Readonly<{
  view: ActivityCanvasView;
  onSelect: (category: ActivityCategory) => void;
}>) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label="Common elements"
          title="Common elements"
          className="rounded-xl lg:w-auto lg:px-2.5"
        >
          <LayoutGrid aria-hidden="true" />
          <span className="hidden lg:inline">Common elements</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8}>
        {groups
          .filter((group) => view === "overview" || view === group.view)
          .map((group) => (
            <DropdownMenuGroup key={group.kind}>
              <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
              {DEFAULT_CATEGORIES.filter(
                (category) => category.kind === group.kind
              ).map((category) => (
                <DropdownMenuItem
                  key={category.id}
                  onSelect={() => onSelect(category)}
                >
                  {category.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
          ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
