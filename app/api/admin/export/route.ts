import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { rowsToCsv, csvResponse } from "@/lib/csv-export";
import {
  exportBookingsCsv,
  exportClientsCsv,
  exportProvidersCsv,
  exportServicesCsv,
  exportSubscriptionsCsv,
  getAdminStats,
} from "@/lib/admin-stats";

export const dynamic = "force-dynamic";

const EXPORT_TYPES = {
  providers: {
    filename: "prestataires.csv",
    headers: [
      "id",
      "nom",
      "email",
      "telephone",
      "kyc",
      "abonnement_actif",
      "abonnement_expire_le",
      "notes_abonnement",
      "annonces",
      "reservations",
      "avis_recus",
      "en_avant_accueil",
      "inscrit_le",
    ],
    rows: exportProvidersCsv,
  },
  services: {
    filename: "annonces.csv",
    headers: [
      "id",
      "titre",
      "categorie",
      "prix",
      "ville",
      "disponible",
      "en_avant_accueil",
      "prestataire",
      "email_prestataire",
      "cree_le",
    ],
    rows: exportServicesCsv,
  },
  bookings: {
    filename: "reservations.csv",
    headers: [
      "id",
      "statut",
      "date",
      "creneau_debut",
      "creneau_fin",
      "titre",
      "prix",
      "categorie",
      "ville",
      "client",
      "email_client",
      "prestataire",
      "email_prestataire",
      "cree_le",
    ],
    rows: exportBookingsCsv,
  },
  clients: {
    filename: "clients.csv",
    headers: [
      "id",
      "nom",
      "email",
      "telephone",
      "email_verifie",
      "reservations",
      "demandes",
      "avis_donnes",
      "inscrit_le",
    ],
    rows: exportClientsCsv,
  },
  subscriptions: {
    filename: "abonnements.csv",
    headers: [
      "id_prestataire",
      "nom",
      "email",
      "kyc",
      "debut",
      "expiration",
      "statut",
      "notes",
    ],
    rows: exportSubscriptionsCsv,
  },
} as const;

type ExportType = keyof typeof EXPORT_TYPES;

function isExportType(value: string | null): value is ExportType {
  return value != null && value in EXPORT_TYPES;
}

export const GET = withApiHandler("GET /api/admin/export", async (req) => {
  const auth = await requireAdmin(req);

  const type = req.nextUrl.searchParams.get("type");

  if (type === "stats") {
    const stats = await getAdminStats();
    const rows: unknown[][] = [
      ["utilisateurs_clients", stats.users.clients],
      ["utilisateurs_prestataires", stats.users.providers],
      ["nouveaux_clients_30j", stats.users.newClients30],
      ["nouveaux_prestataires_30j", stats.users.newProviders30],
      ["kyc_approuves", stats.kyc.approved],
      ["kyc_en_attente", stats.kyc.pending],
      ["abonnements_actifs", stats.subscriptions.active],
      ["abonnements_expire_bientot", stats.subscriptions.expiringSoon],
      ["annonces_total", stats.services.total],
      ["annonces_disponibles", stats.services.available],
      ["reservations_total", stats.bookings.total],
      ["reservations_30j", stats.bookings.last30Days],
      ["demandes_ouvertes", stats.requests.open],
      ["avis_total", stats.reviews.total],
      ["note_moyenne", stats.reviews.averageRating ?? ""],
      ["conversations", stats.messaging.conversations],
      ["messages", stats.messaging.messages],
      ["transactions_reussies", stats.transactions.successful],
      ["revenu_total_mga", stats.transactions.totalRevenue],
      ["genere_le", stats.generatedAt],
    ];
    const csv = rowsToCsv(["indicateur", "valeur"], rows);
    return csvResponse(csv, "statistiques.csv");
  }

  if (!isExportType(type)) {
    return NextResponse.json(
      {
        error:
          "Type d'export invalide. Valeurs : providers, services, bookings, clients, subscriptions, stats",
      },
      { status: 400 }
    );
  }

  const config = EXPORT_TYPES[type];
  const rows = await config.rows();
  const csv = rowsToCsv([...config.headers], rows);
  return csvResponse(csv, config.filename);
});
