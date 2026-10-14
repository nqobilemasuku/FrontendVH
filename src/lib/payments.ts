import { api } from "./api";

/** The once-off application fee (ZAR). */
export const APPLICATION_FEE = 150;

/** Whether the current student has a paid application fee. */
export const getFeeStatus = () =>
  api.get<{ paid: boolean }>("/api/Payments/application-fee/status");

/** Start a fee payment; returns a PayFast checkout URL to redirect the student to. */
export const startFeePayment = () =>
  api.post<{ reference: string; checkoutUrl: string | null; message?: string | null }>(
    "/api/Payments/application-fee",
    { amount: APPLICATION_FEE },
  );
