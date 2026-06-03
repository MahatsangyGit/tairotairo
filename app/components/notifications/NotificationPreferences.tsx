"use client";

import { useState, useEffect } from "react";
import PushNotificationSetup from "./PushNotificationSetup";

export default function NotificationPreferences() {
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyPush, setNotifyPush] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    fetch("/api/notifications/preferences")
      .then((r) => r.json())
      .then((d) => {
        if (d.preferences) {
          setNotifyEmail(d.preferences.notifyEmail);
          setNotifyPush(d.preferences.notifyPush);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage("");

    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifyEmail, notifyPush }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage("Préférences enregistrées");
    } else {
      setMessage(data.error ?? "Erreur");
    }
  };

  if (loading) return <p className="text-gray-500 text-sm">Chargement...</p>;

  return (
    <div className="flex flex-col gap-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-2">Canaux de notification</h2>
        <p className="text-sm text-gray-500 mb-4">
          Les alertes (réservations, propositions, etc.) apparaissent dans la cloche
          et peuvent être envoyées en push. Les emails ne sont envoyés que lorsque vous
          recevez un message in-app.
        </p>

        <label className="flex items-center gap-3 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyEmail}
            onChange={(e) => setNotifyEmail(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600"
          />
          <span className="text-sm text-gray-700">
            Email lors de la réception d&apos;un message in-app
          </span>
        </label>

        <label className="flex items-center gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={notifyPush}
            onChange={(e) => setNotifyPush(e.target.checked)}
            className="w-4 h-4 rounded border-gray-300 text-brand-600"
          />
          <span className="text-sm text-gray-700">Notifications push (navigateur)</span>
        </label>

        {message && (
          <p
            className={`text-sm mb-3 ${message.includes("Erreur") ? "text-red-500" : "text-brand-600"}`}
          >
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {saving ? "Enregistrement..." : "Enregistrer les préférences"}
        </button>
      </div>

      {notifyPush && <PushNotificationSetup />}
    </div>
  );
}
