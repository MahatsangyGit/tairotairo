"use client";

import { useState, useCallback, useEffect } from "react";
import { apiFetch, ApiClientError, type ApiRouter } from "@/lib/api-client";

export type UseListingCrudConfig = {
  listUrl: string;
  listKey: string;
  router: ApiRouter;
  loginPath?: string;
  forbiddenRedirect?: string;
  autoFetch?: boolean;
};

export function useListingCrud<T>({
  listUrl,
  listKey,
  router,
  loginPath,
  forbiddenRedirect,
  autoFetch = true,
}: UseListingCrudConfig) {
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAuthError = useCallback(
    (err: ApiClientError): boolean => {
      if (err.status === 401) return true;
      if (err.status === 403 && forbiddenRedirect) {
        router.push(forbiddenRedirect);
        return true;
      }
      return false;
    },
    [router, forbiddenRedirect]
  );

  const fetchList = useCallback(
    async (options?: { silent?: boolean }) => {
      if (!options?.silent) {
        setLoading(true);
        setError("");
      }

      try {
        const data = await apiFetch<Record<string, T[]>>(listUrl, {
          router,
          loginPath,
          cache: "no-store",
        });
        setItems(data[listKey] ?? []);
      } catch (err) {
        if (err instanceof ApiClientError) {
          if (handleAuthError(err)) return;
          if (!options?.silent) setError(err.message);
          return;
        }
        if (!options?.silent) setError("Une erreur est survenue");
      } finally {
        if (!options?.silent) setLoading(false);
      }
    },
    [listUrl, listKey, router, loginPath, handleAuthError]
  );

  useEffect(() => {
    if (autoFetch) fetchList();
  }, [autoFetch, fetchList]);

  return {
    items,
    setItems,
    loading,
    setLoading,
    error,
    setError,
    fetchList,
    handleAuthError,
    showForm,
    setShowForm,
    editingId,
    setEditingId,
  };
}
