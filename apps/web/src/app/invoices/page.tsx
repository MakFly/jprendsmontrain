"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Receipt } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { customerApi } from "@/lib/api/customer";

export default function InvoicesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["invoices"],
    queryFn: customerApi.invoices,
  });
  const invoices = data?.invoices ?? [];

  return (
    <AppShell>
      <div className="mx-auto max-w-lg space-y-3">
        {isLoading && <div className="h-24 animate-pulse rounded-xl bg-muted" />}

        {!isLoading && invoices.length === 0 && (
          <div className="rounded-xl border border-dashed border-border p-6 text-center">
            <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
            <p className="mt-2 text-sm text-muted-foreground">
              Vos factures apparaitront ici
            </p>
          </div>
        )}

        {invoices.map((invoice) => (
          <div
            key={`${invoice.month}-${invoice.date}`}
            className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
          >
            <div className="flex items-center gap-3">
              <Receipt className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="font-semibold">{invoice.month as string}</p>
                <p className="text-sm text-muted-foreground">{invoice.date as string}</p>
              </div>
            </div>
            <p className="font-semibold">{invoice.amount as string}</p>
          </div>
        ))}
      </div>
    </AppShell>
  );
}
