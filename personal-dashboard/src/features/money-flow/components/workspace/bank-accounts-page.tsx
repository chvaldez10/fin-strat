"use client";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { useMoneyFlowPlan } from "../../persistence/use-money-flow-plan";
import type { YearMonth } from "../../types";
import { BankAccountList } from "./bank-account-list";
import { BankAccountListLoading } from "./bank-account-list-loading";
import { CreateAccountForm } from "./create-account-form";

export function BankAccountsPage() {
  const data = useMoneyFlowPlan();
  if (data.isLoading) return <BankAccountListLoading />;
  return (
    <BankAccountsContent key={data.root?._id ?? data.userId} data={data} />
  );
}

function BankAccountsContent({
  data,
}: Readonly<{
  data: ReturnType<typeof useMoneyFlowPlan>;
}>) {
  const { root, accounts, status, loadMore } = data;
  const [adding, setAdding] = useState(false);
  const createAccount = useMutation(api.moneyFlow.createAccount);
  return (
    <BankAccountList
      accounts={accounts}
      onAddAccount={() => setAdding(true)}
      onLoadMore={
        status === "CanLoadMore" || status === "LoadingMore"
          ? () => loadMore(25)
          : undefined
      }
      loadingMore={status === "LoadingMore"}
    >
      {adding && (
        <CreateAccountForm
          onCancel={() => setAdding(false)}
          className="m-0"
          planStartMonth={root?.scenario.startMonth as YearMonth | undefined}
          onSubmit={async (values) => {
            await createAccount(values);
            setAdding(false);
          }}
        />
      )}
    </BankAccountList>
  );
}
