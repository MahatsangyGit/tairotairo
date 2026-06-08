"use client";

import { useState } from "react";

interface ReviewFormProps {
  bookingId: string;
  providerName: string;
  onSuccess?: () => void;
}

function StarPicker({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className={`text-2xl ${star <= value ? "text-yellow-400" : "text-gray-200"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function ReviewForm({
  bookingId,
  providerName,
  onSuccess,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId, rating, comment: comment || undefined }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible de publier l'avis");
        return;
      }

      onSuccess?.();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 pt-4 border-t border-brand-100 bg-brand-50/50 rounded-xl p-4">
      <h4 className="font-semibold text-foreground text-sm mb-2">
        Laisser un avis pour {providerName}
      </h4>
      <StarPicker value={rating} onChange={setRating} />
      <textarea
        placeholder="Commentaire (optionnel)"
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        className="w-full mt-3 px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:border-brand-500"
      />
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <button
        onClick={handleSubmit}
        disabled={loading}
        className="mt-3 bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
      >
        {loading ? "Publication..." : "Publier l'avis"}
      </button>
    </div>
  );
}
