import { NextResponse } from "next/server";
import { withApiHandler } from "@/lib/api-handler";
import { requireAdmin } from "@/lib/admin-auth";
import { rowsToCsv, csvResponse, csvStreamResponse } from "@/lib/csv-export";
import {
  iterateBookingsCsv,
  iterateClientsCsv,
  iterateProvidersCsv,
  iterateServicesCsv,
  iterateSubscriptionsCsv,
  getAdminStats,
} from "@/lib/admin-stats";
import { API_RATE_LIMITS, enforceRateLimit } from "@/lib/rate-limit";

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
    rows: iterateProvidersCsv,
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
    rows: iterateServicesCsv,
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
    rows: iterateBookingsCsv,
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
    rows: iterateClientsCsv,
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
    rows: iterateSubscriptionsCsv,
  },
} as const;

type ExportType = keyof typeof EXPORT_TYPES;

function isExportType(value: string | null): value is ExportType {
  return value != null && value in EXPORT_TYPES;
}

export const GET = withApiHandler("GET /api/admin/export", async (req) => {
  const auth = await requireAdmin(req);

  const rateLimited = await enforceRateLimit(
    req,
    "admin-export",
    API_RATE_LIMITS.adminExport,
    { userId: auth.userId }
  );
  if (rateLimited) return rateLimited;

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
      ["vues_video_ampianaro", stats.learning.videoViewsTotal],
      ["vues_video_ampianaro_30j", stats.learning.videoViewsLast30],
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
  return csvStreamResponse(config.filename, [...config.headers], config.rows());
});
