"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StatusAlert } from "@/components/ui/status-alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Role = "CLIENT" | "PROVIDER" | "ADMIN";
type RoleFilter = Role | "all";
type StatusFilter = "all" | "active" | "suspended";

interface UserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: Role;
  suspendedAt: string | null;
  kycStatus: string | null;
  createdAt: string;
  stats: {
    services: number;
    requests: number;
    bookingsAsClient: number;
    bookingsAsProvider: number;
  };
}

type PendingAction =
  | { type: "suspend"; user: UserRow }
  | { type: "unsuspend"; user: UserRow }
  | { type: "setRole"; user: UserRow; role: Role };

const ROLE_LABEL: Record<Role, string> = {
  CLIENT: "Client",
  PROVIDER: "Prestataire",
  ADMIN: "Administrateur",
};

function RoleBadge({ role }: { role: Role }) {
  if (role === "ADMIN") {
    return <Badge variant="default">Admin</Badge>;
  }
  if (role === "PROVIDER") {
    return (
      <Badge variant="outline" className="border-brand-200 bg-brand-50 text-brand-800">
        Prestataire
      </Badge>
    );
  }
  return <Badge variant="secondary">Client</Badge>;
}

export default function AdminUsersPanel() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [counts, setCounts] = useState({
    all: 0,
    clients: 0,
    providers: 0,
    admins: 0,
    suspended: 0,
  });
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 25,
    total: 0,
    totalPages: 1,
  });
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
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
      setCounts(data.counts ?? counts);
      setPagination(data.pagination ?? pagination);
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

  const dialogTitle =
    pendingAction?.type === "suspend"
      ? "Suspendre le compte"
      : pendingAction?.type === "unsuspend"
        ? "Réactiver le compte"
        : pendingAction?.type === "setRole"
          ? "Changer le rôle"
          : "";

  const dialogDescription = (() => {
    if (!pendingAction) return "";
    const name = pendingAction.user.name;
    if (pendingAction.type === "suspend") {
      return `Suspendre le compte de ${name} ? L'utilisateur ne pourra plus se connecter.`;
    }
    if (pendingAction.type === "unsuspend") {
      return `Réactiver le compte de ${name} ?`;
    }
    return `Attribuer le rôle « ${ROLE_LABEL[pendingAction.role]} » à ${name} ?`;
  })();

  const isSelf = (userId: string) => currentAdminId === userId;

  return (
    <div className="flex flex-col gap-6">
      <StatusAlert variant="info">
        Gérez les comptes utilisateurs : consultez la liste, suspendez un compte ou
        modifiez son rôle (client, prestataire, administrateur).
      </StatusAlert>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={roleFilter}
          onValueChange={(v) => {
            setRoleFilter(v as RoleFilter);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Rôle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les rôles ({counts.all})</SelectItem>
            <SelectItem value="CLIENT">Clients ({counts.clients})</SelectItem>
            <SelectItem value="PROVIDER">Prestataires ({counts.providers})</SelectItem>
            <SelectItem value="ADMIN">Admins ({counts.admins})</SelectItem>
          </SelectContent>
        </Select>

        <Select
          value={statusFilter}
          onValueChange={(v) => {
            setStatusFilter(v as StatusFilter);
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Statut" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous</SelectItem>
            <SelectItem value="active">Actifs</SelectItem>
            <SelectItem value="suspended">Suspendus ({counts.suspended})</SelectItem>
          </SelectContent>
        </Select>

        <form
          className="flex flex-1 min-w-[200px] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(searchInput.trim());
            setPagination((p) => ({ ...p, page: 1 }));
          }}
        >
          <Input
            placeholder="Rechercher nom, email, téléphone…"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <Button type="submit" variant="outline">
            Rechercher
          </Button>
        </form>
      </div>

      {loading && <p className="text-muted-foreground text-sm">Chargement…</p>}

      {!loading && (
        <Card>
          <CardHeader>
            <CardTitle>
              Utilisateurs ({pagination.total})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 pb-6">
            {users.length === 0 ? (
              <p className="text-muted-foreground text-sm px-6 py-12 text-center">
                Aucun utilisateur trouvé
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Inscrit le</TableHead>
                    <TableHead>Activité</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell>
                        <p className="font-medium">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        {u.phone && (
                          <p className="text-xs text-muted-foreground">{u.phone}</p>
                        )}
                        {isSelf(u.id) && (
                          <Badge variant="outline" className="mt-1">
                            Vous
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isSelf(u.id) ? (
                          <RoleBadge role={u.role} />
                        ) : (
                          <Select
                            value={u.role}
                            onValueChange={(role) => {
                              const next = role as Role;
                              if (next === u.role) return;
                              setPendingAction({
                                type: "setRole",
                                user: u,
                                role: next,
                              });
                            }}
                            disabled={busyId != null}
                          >
                            <SelectTrigger className="w-[140px]" size="sm">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="CLIENT">Client</SelectItem>
                              <SelectItem value="PROVIDER">Prestataire</SelectItem>
                              <SelectItem value="ADMIN">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        {u.suspendedAt ? (
                          <Badge variant="destructive">Suspendu</Badge>
                        ) : (
                          <Badge variant="outline" className="border-green-200 bg-green-50 text-green-800">
                            Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(u.createdAt).toLocaleDateString("fr-MG", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {u.role === "PROVIDER" && (
                          <>
                            {u.stats.services} annonce{u.stats.services !== 1 ? "s" : ""}
                            {u.kycStatus && (
                              <> · KYC {u.kycStatus.toLowerCase()}</>
                            )}
                          </>
                        )}
                        {u.role === "CLIENT" && (
                          <>
                            {u.stats.requests} demande{u.stats.requests !== 1 ? "s" : ""}
                            {" · "}
                            {u.stats.bookingsAsClient} résa.
                          </>
                        )}
                        {u.role === "ADMIN" && "—"}
                      </TableCell>
                      <TableCell>
                        {!isSelf(u.id) && (
                          <div className="flex flex-wrap gap-2">
                            {u.suspendedAt ? (
                              <Button
                                type="button"
                                size="xs"
                                variant="outline"
                                disabled={busyId != null}
                                onClick={() =>
                                  setPendingAction({ type: "unsuspend", user: u })
                                }
                              >
                                Réactiver
                              </Button>
                            ) : (
                              <Button
                                type="button"
                                size="xs"
                                variant="destructive"
                                disabled={busyId != null}
                                onClick={() =>
                                  setPendingAction({ type: "suspend", user: u })
                                }
                              >
                                Suspendre
                              </Button>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Page {pagination.page} sur {pagination.totalPages}
          </p>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pagination.page <= 1 || loading}
              onClick={() =>
                setPagination((p) => ({ ...p, page: Math.max(1, p.page - 1) }))
              }
            >
              Précédent
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={pagination.page >= pagination.totalPages || loading}
              onClick={() =>
                setPagination((p) => ({
                  ...p,
                  page: Math.min(pagination.totalPages, p.page + 1),
                }))
              }
            >
              Suivant
            </Button>
          </div>
        </div>
      )}

      {error && <StatusAlert variant="error">{error}</StatusAlert>}
      {success && <StatusAlert variant="success">{success}</StatusAlert>}

      <ConfirmDialog
        open={pendingAction != null}
        onOpenChange={(open) => {
          if (!open) setPendingAction(null);
        }}
        title={dialogTitle}
        description={dialogDescription}
        confirmLabel={
          pendingAction?.type === "unsuspend"
            ? "Réactiver"
            : pendingAction?.type === "setRole"
              ? "Confirmer"
              : pendingAction?.type === "suspend"
                ? "Suspendre"
                : "Confirmer"
        }
        destructive={
          pendingAction?.type === "suspend" ||
          (pendingAction?.type === "setRole" &&
            pendingAction.role !== pendingAction.user.role)
        }
        loading={busyId != null}
        onConfirm={runAction}
      />
    </div>
  );
}
