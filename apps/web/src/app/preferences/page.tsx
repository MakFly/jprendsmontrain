"use client";

import { AppShell } from "@/components/layout/app-shell";
import { Settings } from "lucide-react";

export default function PreferencesPage() {
  return (
    <AppShell>
      <div className="mx-auto max-w-lg">
        <div className="rounded-xl border border-dashed border-border p-6 text-center">
          <Settings className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">
            Vos preferences de voyage apparaitront ici
          </p>
        </div>
      </div>
    </AppShell>
  );
}
