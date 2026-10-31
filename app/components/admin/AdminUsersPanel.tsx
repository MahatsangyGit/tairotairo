"use client";

import { useCallback, useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  AdminUsersFiltersBar,
  AdminUsersPagination,
  AdminUsersTable,
  getAdminUserDialogCopy,
  type AdminUserCounts,
  type AdminUserPagination,
  type AdminUserPendingAction,
  type AdminUserRoleFilter,
  type AdminUserRow,
  type AdminUserStatusFilter,
} from "@/components/admin/AdminUsersTableSection";

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [counts, setCounts] = useState<AdminUserCounts>({
    all: 0,
    clients: 0,
    providers: 0,
    admins: 0,
    suspended: 0,
    loginLocked: 0,
  });
  const [pagination, setPagination] = useState<AdminUserPagination>({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [roleFilter, setRoleFilter] = useState<AdminUserRoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<AdminUserStatusFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] =
    useState<AdminUserPendingAction | null>(null);
  const [currentAdminId, setCurrentAdminId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((data) => {
        if (data.user?.id) setCurrentAdminId(data.user.id);
      })
      .catch(() => {});
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        page: String(pagination.page),
        status: statusFilter,
      });
      if (roleFilter !== "all") params.set("role", roleFilter);
      if (search) params.set("q", search);

      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur de chargement");
        return;
      }
      setUsers(data.users ?? []);
      setCounts((prev) => data.counts ?? prev);
      setPagination((prev) => data.pagination ?? prev);
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setLoading(false);
    }
  }, [pagination.page, roleFilter, statusFilter, search]);

  useEffect(() => {
    load();
  }, [load]);

  const runAction = async () => {
    if (!pendingAction) return;

    setBusyId(pendingAction.user.id);
    setError("");
    setSuccess("");

    const body =
      pendingAction.type === "setRole"
        ? { action: "setRole", role: pendingAction.role }
        : { action: pendingAction.type };

    try {
      const res = await fetch(`/api/admin/users/${pendingAction.user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Action impossible");
        return;
      }
      setSuccess(data.message);
      setPendingAction(null);
      await load();
    } catch {
      setError("Une erreur est survenue");
    } finally {
      setBusyId(null);
    }
  };

  const dialogCopy = getAdminUserDialogCopy(pendingAction);

  return (
    <div className="flex flex-col gap-6">
      <StatusAlert variant="info">
        Gérez les comptes utilisateurs : consultez la liste, suspendez un compte,
        débloquez une connexion verrouillée ou modifiez son rôle.
      </StatusAlert>

      <AdminUsersFiltersBar
        roleFilter={roleFilter}
        statusFilter={statusFilter}
        searchInput={searchInput}
        counts={counts}
        onRoleFilterChange={(next) => {
          setRoleFilter(next);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onStatusFilterChange={(next) => {
          setStatusFilter(next);
          setPagination((p) => ({ ...p, page: 1 }));
        }}
        onSearchInputChange={setSearchInput}
        onSearchSubmit={() => {
          setSearch(searchInput.trim());
          setPagination((p) => ({ ...p, page: 1 }));
        }}
      />

      {loading ? (
        <p className="text-muted-foreground text-sm">Chargement…</p>
      ) : (
        <AdminUsersTable
          users={users}
          total={pagination.total}
          currentAdminId={currentAdminId}
          busyId={busyId}
          onPendingAction={setPendingAction}
        />
      )}

      <AdminUsersPagination
        pagination={pagination}
        loading={loading}
        onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
      />

      {error && <StatusAlert variant="error">{error}</StatusAlert>}
      {success && <StatusAlert variant="success">{success}</StatusAlert>}

      <ConfirmDialog
        open={pendingAction != null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={dialogCopy.title}
        description={dialogCopy.description}
        confirmLabel={dialogCopy.confirmLabel}
        destructive={dialogCopy.destructive}
        loading={busyId != null}
        onConfirm={runAction}
      />
    </div>
  );
}
