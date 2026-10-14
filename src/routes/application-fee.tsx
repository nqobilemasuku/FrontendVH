/* eslint-disable prettier/prettier */
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  CreditCard,
  Landmark,
  Smartphone,
  ShieldCheck,
  Lock,
  CheckCircle2,
  Receipt,
  ArrowRight,
  Info,
  Loader2,
} from "lucide-react";
import { StudentShell } from "@/components/StudentShell";
import { PageHeader, Panel, IconBadge, StatusPill, table, btn, type Tone } from "@/components/dashboard/ui";
import { TableSkeleton } from "@/components/dashboard/skeletons";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api";

export const Route = createFileRoute("/application-fee")({
  head: () => ({ meta: [{ title: "Application Fee · Varsity Hub" }] }),
  component: ApplicationFee,
});

type Method = "card" | "eft" | "wallet";
type InitiateFeeRequest = { amount: number };
type PaymentResponse = { reference: string; checkoutUrl: string | null; message: string | null };
type Payment = {
  amount: number;
  currency: string;
  method: string;
  status: string;
  reference: string;
  paidAt: string | null;
  createdAt: string;
};

function paymentStatusTone(status: string): Tone {
  switch (status?.toLowerCase()) {
    case "paid":
      return "emerald";
    case "pending":
      return "amber";
    case "failed":
    case "refunded":
      return "rose";
    default:
      return "slate";
  }
}

const FEE_AMOUNT = 253;

const methods: { id: Method; label: string; desc: string; icon: typeof CreditCard }[] = [
  { id: "card", label: "Credit / Debit Card", desc: "Visa, Mastercard", icon: CreditCard },
  { id: "eft", label: "Instant EFT", desc: "Pay from your bank", icon: Landmark },
  { id: "wallet", label: "Mobile Wallet", desc: "SnapScan, Zapper", icon: Smartphone },
];

const lineItems: { label: string; value: string; tone?: Tone }[] = [
  { label: "Application fee", value: "R 200.00" },
  { label: "Service fee", value: "R 20.00" },
  { label: "VAT (15%)", value: "R 33.00" },
];

function isHttpUrl(url: string | null | undefined): url is string {
  return !!url && /^https?:\/\//i.test(url);
}

function Field({ label, placeholder, className }: { label: string; placeholder: string; className?: string }) {
  return (
    <div className={className}>
      <label className="text-xs font-semibold text-foreground">{label}</label>
      <input
        placeholder={placeholder}
        className="mt-1 w-full rounded-lg border border-border/60 bg-background px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
    </div>
  );
}

function ApplicationFee() {
  const [method, setMethod] = useState<Method>("card");

  const pay = useMutation({
    mutationFn: (body: InitiateFeeRequest) => api.post<PaymentResponse>("/api/Payments/application-fee", body),
  });

  const payments = useQuery({
    queryKey: ["me", "payments"],
    queryFn: () => api.get<Payment[]>("/api/me/payments"),
  });

  function handlePay(e: React.FormEvent) {
    e.preventDefault();
    pay.mutate({ amount: FEE_AMOUNT });
  }

  const result = pay.data;

  // Success / redirect screen once the payment has been initiated.
  if (result) {
    const redirect = isHttpUrl(result.checkoutUrl);
    return (
      <StudentShell>
        <div className="mx-auto max-w-lg py-10 text-center">
          <div className="relative mx-auto flex h-20 w-20 items-center justify-center">
            <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/30" />
            <span className="absolute inset-1.5 rounded-full bg-emerald-100" />
            <CheckCircle2 className="relative h-11 w-11 text-emerald-600" />
          </div>
          <h1 className="mt-6 text-2xl font-bold">{redirect ? "Almost there" : "Payment initiated"}</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {result.message ??
              (redirect
                ? "Continue to our secure payment gateway to complete your application fee."
                : "Your application fee request has been created. Keep your reference for your records.")}
          </p>
          <Panel className="mt-6 text-left">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-semibold tabular-nums">{result.reference}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-medium">R {FEE_AMOUNT.toFixed(2)}</span>
            </div>
            <div className="mt-2 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Method</span>
              <span className="font-medium capitalize">{method}</span>
            </div>
          </Panel>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {redirect ? (
              <a href={result.checkoutUrl!} className={btn.primary} target="_blank" rel="noreferrer">
                Continue to payment <ArrowRight className="h-4 w-4" />
              </a>
            ) : (
              <Link to={"/application-form" as string} className={btn.primary}>
                Start application <ArrowRight className="h-4 w-4" />
              </Link>
            )}
            <Link to={"/applications" as string} className={btn.outline}>
              <Receipt className="h-4 w-4" /> View applications
            </Link>
          </div>
        </div>
      </StudentShell>
    );
  }

  return (
    <StudentShell>
      <PageHeader
        icon={CreditCard}
        eyebrow="Applications"
        title="Pay application fee"
        subtitle="A once-off application fee is required before you can submit your application."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Payment methods + form */}
        <div className="space-y-6">
          <Panel title="Payment method" icon={Landmark}>
            <div className="grid gap-3 sm:grid-cols-3">
              {methods.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all",
                    method === m.id
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border/60 hover:bg-muted/50",
                  )}
                >
                  <m.icon className={cn("h-5 w-5", method === m.id ? "text-primary" : "text-muted-foreground")} />
                  <span className="text-sm font-semibold">{m.label}</span>
                  <span className="text-xs text-muted-foreground">{m.desc}</span>
                </button>
              ))}
            </div>
          </Panel>

          <Panel title="Payment details" icon={Lock}>
            <form onSubmit={handlePay} className="space-y-4">
              {method === "card" && (
                <>
                  <Field label="Cardholder name" placeholder="Name as it appears on card" />
                  <Field label="Card number" placeholder="1234 5678 9012 3456" />
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="Expiry date" placeholder="MM / YY" />
                    <Field label="CVV" placeholder="123" />
                  </div>
                </>
              )}
              {method === "eft" && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  You&apos;ll be securely redirected to your bank to authorise the payment of{" "}
                  <span className="font-semibold text-foreground">R 253.00</span>.
                </div>
              )}
              {method === "wallet" && (
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4 text-sm text-muted-foreground">
                  Scan the QR code with your SnapScan or Zapper app to complete the payment.
                </div>
              )}

              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" className="mt-0.5" required />
                <span>
                  I understand the application fee is non-refundable and agree to the{" "}
                  <a className="font-semibold text-primary underline" href="#">
                    payment terms
                  </a>
                  .
                </span>
              </label>

              {pay.isError && (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  Couldn't start the payment. Please try again.
                </div>
              )}

              <button type="submit" className={cn(btn.primary, "w-full")} disabled={pay.isPending}>
                {pay.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />} Pay R 253.00
              </button>
            </form>
          </Panel>
        </div>

        {/* Order summary */}
        <div className="space-y-6">
          <Panel title="Fee summary" icon={Receipt}>
            <div className="space-y-3">
              {lineItems.map((l) => (
                <div key={l.label} className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{l.label}</span>
                  <span className="font-medium tabular-nums">{l.value}</span>
                </div>
              ))}
              <div className="border-t border-border/60 pt-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">Total due</span>
                  <span className="text-xl font-bold tabular-nums">R 253.00</span>
                </div>
              </div>
            </div>
          </Panel>

          <div className="flex items-start gap-3 rounded-2xl border border-border/60 bg-card p-4">
            <IconBadge icon={ShieldCheck} tone="emerald" />
            <div>
              <h4 className="text-sm font-semibold">Secure payment</h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Payments are encrypted end-to-end and processed by a PCI-DSS compliant gateway.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
            <span>
              The fee covers a single application cycle and unlocks applications to all participating
              universities.
            </span>
          </div>
        </div>
      </div>

      {/* Payment history */}
      <Panel className="mt-6" flush icon={Receipt} title="Payment history" description="Your application fee payments">
        {payments.isLoading && <TableSkeleton className="m-5" cols={5} />}
        {payments.isError && (
          <div className="m-5 rounded-xl border border-rose-200 bg-rose-50 p-6 text-center text-sm text-rose-700">
            Couldn't load your payment history.
          </div>
        )}
        {!payments.isLoading && !payments.isError && (
          <div className="overflow-x-auto">
            <table className={table.el}>
              <thead className={table.thead}>
                <tr>
                  <th className={table.th}>Date</th>
                  <th className={table.th}>Amount</th>
                  <th className={table.th}>Method</th>
                  <th className={table.th}>Reference</th>
                  <th className={table.th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(payments.data ?? []).map((p, i) => (
                  <tr key={p.reference ?? i} className={table.row}>
                    <td className={cn(table.td, "text-muted-foreground")}>
                      {new Date(p.createdAt).toLocaleDateString("en-ZA", { day: "2-digit", month: "short", year: "numeric" })}
                    </td>
                    <td className={cn(table.td, "font-medium tabular-nums")}>
                      {`${p.currency} ${(p.amount ?? 0).toFixed(2)}`}
                    </td>
                    <td className={cn(table.td, "capitalize")}>{p.method}</td>
                    <td className={cn(table.td, "tabular-nums text-muted-foreground")}>{p.reference}</td>
                    <td className={table.td}>
                      <StatusPill tone={paymentStatusTone(p.status)} className="capitalize">{p.status}</StatusPill>
                    </td>
                  </tr>
                ))}
                {(payments.data ?? []).length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-sm text-muted-foreground">
                      No payments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </StudentShell>
  );
}
