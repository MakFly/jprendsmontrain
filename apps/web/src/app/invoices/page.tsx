"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Receipt } from "lucide-react";

export default function InvoicesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Receipt className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Vos factures apparaitront ici
          </p>
        </div>
      </div>
    </AppShell>
  );
}
