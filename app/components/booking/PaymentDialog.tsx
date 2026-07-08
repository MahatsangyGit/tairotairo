"use client";

import { useState, useEffect } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PAYMENT_METHOD_OPTIONS } from "@/lib/subscription-plans";

type PaymentMethodId = "ORANGE_MONEY" | "MVOLA" | "AIRTEL_MONEY";

interface PaymentDialogProps {
  open: boolean;
  booking:
    | {
        id: string;
        displayTitle?: string | null;
        displayPrice?: number | null;
        service?: { title: string; price: number } | null;
        requestResponse?: { proposedPrice: number | null } | null;
      }
    | null;
  loading?: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (method: PaymentMethodId) => void;
}

export default function PaymentDialog({
  open,
  booking,
  loading = false,
  onOpenChange,
  onConfirm,
}: PaymentDialogProps) {
  const [method, setMethod] = useState<PaymentMethodId>("ORANGE_MONEY");

  useEffect(() => {
    if (open) setMethod("ORANGE_MONEY");
  }, [open]);

  const title = booking?.displayTitle ?? booking?.service?.title ?? "Réservation";
  const price =
    (booking?.displayPrice ?? booking?.requestResponse?.proposedPrice ?? booking?.service?.price) ?? 0;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Payer la prestation</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <span className="block space-y-1">
              <span className="block font-medium text-foreground">{title}</span>
              <span className="block">
                Montant : <span className="font-semibold text-brand-600">{price.toLocaleString("fr-MG")} Ar</span>
              </span>
              <span className="block">
                Le paiement est sécurisé : les fonds sont conservés par Tairo ampio
                jusqu&apos;à validation de la prestation, puis versés au prestataire.
              </span>
            </span>
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="flex flex-col gap-2 py-2">
          {PAYMENT_METHOD_OPTIONS.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                method === opt.id
                  ? "border-brand-500 bg-brand-50"
                  : "border-border hover:border-brand-300"
              }`}
            >
              <input
                type="radio"
                name="payment-method"
                value={opt.id}
                checked={method === opt.id}
                onChange={() => setMethod(opt.id)}
                className="accent-brand-600"
              />
              <span className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{opt.label}</span>
                <span className="text-xs text-muted-foreground">{opt.hint}</span>
              </span>
            </label>
          ))}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel disabled={loading}>Retour</AlertDialogCancel>
          <AlertDialogAction
            disabled={loading}
            onClick={(e) => {
              e.preventDefault();
              onConfirm(method);
            }}
          >
            {loading ? "Traitement..." : `Payer ${price.toLocaleString("fr-MG")} Ar`}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
