import { createFileRoute, Link } from "@tanstack/react-router";
import { XCircle, ArrowLeft } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";

export const Route = createFileRoute("/application-fee_/cancel")({
  head: () => ({ meta: [{ title: "Payment cancelled · Varsity Hub" }] }),
  component: FeeCancel,
});

function FeeCancel() {
  return (
    <StudentShell>
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-(--shadow-card)">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-100 text-rose-600">
            <XCircle className="h-8 w-8" />
          </div>
          <h1 className="mt-5 text-2xl font-bold">Payment cancelled</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            No payment was taken. You can try again whenever you&apos;re ready — the application fee is
            required before you can submit applications.
          </p>
          <Link
            to="/application-form"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <ArrowLeft className="h-4 w-4" /> Back to application
          </Link>
        </div>
      </div>
    </StudentShell>
  );
}
