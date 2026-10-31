"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export type AdminUserRole = "CLIENT" | "PROVIDER" | "ADMIN";
export type AdminUserRoleFilter = AdminUserRole | "all";
export type AdminUserStatusFilter = "all" | "active" | "suspended";

export interface AdminUserRow {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: AdminUserRole;
  clientKind?: "INDIVIDUAL" | "PROFESSIONAL";
  suspendedAt: string | null;
  loginLockedAt: string | null;
  failedLoginAttempts: number;
  kycStatus: string | null;
  createdAt: string;
  stats: {
    services: number;
    requests: number;
    bookingsAsClient: number;
    bookingsAsProvider: number;
  };
}

export interface AdminUserCounts {
  all: number;
  clients: number;
  providers: number;
  admins: number;
  suspended: number;
  loginLocked: number;
}

export interface AdminUserPagination {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export type AdminUserPendingAction =
  | { type: "suspend"; user: AdminUserRow }
  | { type: "unsuspend"; user: AdminUserRow }
  | { type: "unlockLogin"; user: AdminUserRow }
  | { type: "setRole"; user: AdminUserRow; role: AdminUserRole };

const ROLE_LABEL: Record<AdminUserRole, string> = {
  CLIENT: "Client",
  PROVIDER: "Prestataire",
  ADMIN: "Administrateur",
};

export function getAdminUserDialogCopy(pendingAction: AdminUserPendingAction | null) {
  if (!pendingAction) {
    return { title: "", description: "", confirmLabel: "Confirmer", destructive: false };
  }
  const name = pendingAction.user.name;
  switch (pendingAction.type) {
    case "suspend":
      return {
        title: "Suspendre le compte",
        description: `Suspendre le compte de ${name} ? L'utilisateur ne pourra plus se connecter.`,
        confirmLabel: "Suspendre",
        destructive: true,
      };
    case "unsuspend":
      return {
        title: "Réactiver le compte",
        description: `Réactiver le compte de ${name} ?`,
        confirmLabel: "Réactiver",
        destructive: false,
      };
    case "unlockLogin":
      return {
        title: "Débloquer la connexion",
        description: `Débloquer la connexion de ${name} ? Le compteur de tentatives échouées sera remis à zéro.`,
        confirmLabel: "Débloquer",
        destructive: false,
      };
    case "setRole":
      return {
        title: "Changer le rôle",
        description: `Attribuer le rôle « ${ROLE_LABEL[pendingAction.role]} » à ${name} ?`,
        confirmLabel: "Confirmer",
        destructive: pendingAction.role !== pendingAction.user.role,
      };
  }
}

function RoleBadge({
  role,
  clientKind,
}: {
  role: AdminUserRole;
  clientKind?: "INDIVIDUAL" | "PROFESSIONAL";
}) {
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
  if (clientKind === "PROFESSIONAL") {
    return (
      <Badge variant="outline" className="border-slate-300 bg-slate-900 text-white">
        Client pro
      </Badge>
    );
  }
  return <Badge variant="secondary">Client</Badge>;
}

export function AdminUsersFiltersBar({
  roleFilter,
  statusFilter,
  searchInput,
  counts,
  onRoleFilterChange,
  onStatusFilterChange,
  onSearchInputChange,
  onSearchSubmit,
}: {
  roleFilter: AdminUserRoleFilter;
  statusFilter: AdminUserStatusFilter;
  searchInput: string;
  counts: AdminUserCounts;
  onRoleFilterChange: (value: AdminUserRoleFilter) => void;
  onStatusFilterChange: (value: AdminUserStatusFilter) => void;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Select
        value={roleFilter}
        onValueChange={(v) => onRoleFilterChange(v as AdminUserRoleFilter)}
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
        onValueChange={(v) => onStatusFilterChange(v as AdminUserStatusFilter)}
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
          onSearchSubmit();
        }}
      >
        <Input
          placeholder="Rechercher nom, email, téléphone…"
          value={searchInput}
          onChange={(e) => onSearchInputChange(e.target.value)}
        />
        <Button type="submit" variant="outline">
          Rechercher
        </Button>
      </form>
    </div>
  );
}

export function AdminUsersTable({
  users,
  total,
  currentAdminId,
  busyId,
  onPendingAction,
}: {
  users: AdminUserRow[];
  total: number;
  currentAdminId: string | null;
  busyId: string | null;
  onPendingAction: (action: AdminUserPendingAction) => void;
}) {
  const isSelf = (userId: string) => currentAdminId === userId;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Utilisateurs ({total})</CardTitle>
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
                    {u.role === "CLIENT" && u.clientKind === "PROFESSIONAL" ? (
                      <Badge variant="outline" className="mt-1 border-slate-300">
                        Entreprise
                      </Badge>
                    ) : null}
                    {isSelf(u.id) && (
                      <Badge variant="outline" className="mt-1">
                        Vous
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {isSelf(u.id) ? (
                      <RoleBadge role={u.role} clientKind={u.clientKind} />
                    ) : (
                      <Select
                        value={u.role}
                        onValueChange={(role) => {
                          const next = role as AdminUserRole;
                          if (next === u.role) return;
                          onPendingAction({
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
                    <div className="flex flex-wrap gap-1">
                      {u.suspendedAt ? (
                        <Badge variant="destructive">Suspendu</Badge>
                      ) : (
                        <Badge
                          variant="outline"
                          className="border-green-200 bg-green-50 text-green-800"
                        >
                          Actif
                        </Badge>
                      )}
                      {u.loginLockedAt && (
                        <Badge variant="destructive">Connexion verrouillée</Badge>
                      )}
                    </div>
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
                        {u.kycStatus && <> · KYC {u.kycStatus.toLowerCase()}</>}
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
                        {u.loginLockedAt && (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={busyId != null}
                            onClick={() =>
                              onPendingAction({ type: "unlockLogin", user: u })
                            }
                          >
                            Débloquer connexion
                          </Button>
                        )}
                        {u.suspendedAt ? (
                          <Button
                            type="button"
                            size="xs"
                            variant="outline"
                            disabled={busyId != null}
                            onClick={() =>
                              onPendingAction({ type: "unsuspend", user: u })
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
                              onPendingAction({ type: "suspend", user: u })
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
  );
}

export function AdminUsersPagination({
  pagination,
  loading,
  onPageChange,
}: {
  pagination: AdminUserPagination;
  loading: boolean;
  onPageChange: (page: number) => void;
}) {
  if (pagination.totalPages <= 1) return null;
  return (
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
          onClick={() => onPageChange(Math.max(1, pagination.page - 1))}
        >
          Précédent
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pagination.page >= pagination.totalPages || loading}
          onClick={() =>
            onPageChange(Math.min(pagination.totalPages, pagination.page + 1))
          }
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
