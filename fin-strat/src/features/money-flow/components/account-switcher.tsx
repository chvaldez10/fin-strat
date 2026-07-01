"use client";

import { Building2, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import type { MoneyFlowAccountWorkspace } from "../types";

type AccountSwitcherProps = {
  accounts: MoneyFlowAccountWorkspace[];
  selectedAccountId: string;
  onAccountChange: (accountId: string) => void;
};

export function AccountSwitcher({
  accounts,
  selectedAccountId,
  onAccountChange,
}: AccountSwitcherProps) {
  const selectedAccount =
    accounts.find((account) => account.id === selectedAccountId) ?? accounts[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="outline"
          className="h-10 w-full min-w-0 justify-between gap-2 px-2.5 sm:w-64"
          aria-label="Switch bank account"
        >
          <AccountMark institution={selectedAccount?.institution} />
          <span className="min-w-0 flex-1 truncate text-left font-medium">
            {selectedAccount?.name ?? "Select account"}
          </span>
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        sideOffset={6}
        className="w-(--radix-dropdown-menu-trigger-width) min-w-56 max-w-[calc(100vw-1rem)] p-1.5"
      >
        <DropdownMenuLabel className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Bank accounts
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={selectedAccount?.id}
          onValueChange={onAccountChange}
        >
          {accounts.map((account) => (
            <DropdownMenuRadioItem
              key={account.id}
              value={account.id}
              className="min-h-12 items-center py-2 pr-2 pl-8"
            >
              <AccountMark institution={account.institution} />
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {account.name}
                </span>
                <span className="block text-xs capitalize text-muted-foreground">
                  {account.accountType} / CAD
                </span>
              </span>
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AccountMark({ institution }: { institution?: string }) {
  const isScotiabank = institution?.toLowerCase().includes("scotia");

  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-sm border",
        isScotiabank
          ? "border-red-200 bg-red-50 text-red-700 dark:border-red-950 dark:bg-red-950/50 dark:text-red-300"
          : "border-rose-200 bg-rose-50 text-rose-800 dark:border-rose-950 dark:bg-rose-950/50 dark:text-rose-300"
      )}
      aria-hidden="true"
    >
      <Building2 className="size-3.5" />
    </span>
  );
}
