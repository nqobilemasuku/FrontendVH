import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Loader2, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { getFeeStatus } from "@/lib/payments";

export const Route = createFileRoute("/application-fee_/success")({
  head: () => ({ meta: [{ title: "Payment · Varsity Hub" }] }),
  component: FeeSuccess,
});

/**
 * PayFast redirects the student here BEFORE its server-to-server webhook may
 * have marked the fee paid. The redirect is not proof of payment — only the
 * webhook is — so we poll the fee-status endpoint until it flips to paid.
 */
function FeeSuccess() {
  const [state, setState] = useState<"checking" | "paid" | "timeout">("checking");
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    let tries = 0;
    timer.current = setInterval(async () => {
      tries++;
      const res = await getFeeStatus().catch(() => ({ paid: false }));
      if (res.paid) {
        if (timer.current) clearInterval(timer.current);
        setState("paid");
      } else if (tries >= 15) {
        if (timer.current) clearInterval(timer.current);
        setState("timeout");
      }
    }, 2000);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, []);

  return (
    <StudentShell>
      <div className="mx-auto max-w-md py-10">
        <div className="rounded-2xl border border-border/70 bg-card p-8 text-center shadow-(--shadow-card)">
          {state === "checking" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Confirming your payment…</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                We&apos;re waiting for the payment gateway to confirm. This usually takes a few seconds.
              </p>
            </>
          )}

          {state === "paid" && (
            <>
              <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
                <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
                <span className="absolute inset-1.5 rounded-full bg-emerald-100" />
                <CheckCircle2 className="relative h-11 w-11 text-emerald-600" />
              </div>
              <h1 className="mt-6 text-2xl font-bold">Payment confirmed 🎉</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your application fee is paid. You can now submit applications.
              </p>
              <Link
                to="/application-form"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
              >
                Continue your application <ArrowRight className="h-4 w-4" />
              </Link>
            </>
          )}

          {state === "timeout" && (
            <>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
                <Clock className="h-8 w-8" />
              </div>
              <h1 className="mt-5 text-2xl font-bold">Still processing…</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Your payment is taking a little longer to confirm. It usually clears within a minute — refresh to check again.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="mt-6 inline-flex items-center gap-2 rounded-lg border border-primary/30 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5"
              >
                <RefreshCw className="h-4 w-4" /> Check again
              </button>
            </>
          )}
        </div>
      </div>
    </StudentShell>
  );
}
