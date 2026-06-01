"use client";

import { useState, useEffect } from "react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export default function PushNotificationSetup() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [configured, setConfigured] = useState(false);

  useEffect(() => {
    const ok =
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window &&
      "Notification" in window;
    setSupported(ok);

    if (ok) {
      fetch("/api/notifications/push/subscribe")
        .then((r) => r.json())
        .then((d) => setConfigured(d.configured))
        .catch(() => {});
    }
  }, []);

  const subscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Permission refusée pour les notifications");
        return;
      }

      const keyRes = await fetch("/api/notifications/push/subscribe");
      const keyData = await keyRes.json();

      if (!keyData.configured || !keyData.publicKey) {
        setError(
          "Push non configuré sur le serveur (clés VAPID manquantes)"
        );
        return;
      }

      const registration = await navigator.serviceWorker.register("/sw.js");
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(keyData.publicKey),
      });

      const json = subscription.toJSON();

      const res = await fetch("/api/notifications/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: json.endpoint,
          keys: json.keys,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? "Impossible d'activer le push");
        return;
      }

      setSubscribed(true);
    } catch {
      setError("Erreur lors de l'activation des notifications push");
    } finally {
      setLoading(false);
    }
  };

  const unsubscribe = async () => {
    setLoading(true);
    setError("");

    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        await fetch("/api/notifications/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }

      setSubscribed(false);
    } catch {
      setError("Erreur lors de la désactivation");
    } finally {
      setLoading(false);
    }
  };

  if (!supported) {
    return (
      <p className="text-sm text-gray-400">
        Les notifications push ne sont pas supportées par ce navigateur.
      </p>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
      <h2 className="font-semibold text-gray-800 mb-2">Notifications push</h2>
      <p className="text-sm text-gray-500 mb-4">
        Recevez des alertes sur cet appareil (navigateur ouvert ou en arrière-plan).
      </p>
      {!configured && (
        <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2 mb-3">
          Le serveur n&apos;a pas encore de clés VAPID configurées.
        </p>
      )}
      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
      {subscribed ? (
        <button
          onClick={unsubscribe}
          disabled={loading}
          className="text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
        >
          {loading ? "..." : "Désactiver le push sur cet appareil"}
        </button>
      ) : (
        <button
          onClick={subscribe}
          disabled={loading || !configured}
          className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          {loading ? "Activation..." : "Activer les notifications push"}
        </button>
      )}
    </div>
  );
}
