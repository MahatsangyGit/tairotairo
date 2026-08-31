import { daysAgo } from "@/lib/admin/stats/shared";
import { loadUserAdminStats } from "@/lib/admin/stats/users";
import { loadMarketplaceAdminStats } from "@/lib/admin/stats/marketplace";
import { loadLearningAdminStats } from "@/lib/admin/stats/learning";

export {
  exportProvidersCsv,
  iterateProvidersCsv,
  exportClientsCsv,
  iterateClientsCsv,
  exportSubscriptionsCsv,
  iterateSubscriptionsCsv,
} from "@/lib/admin/stats/users";

export {
  exportServicesCsv,
  iterateServicesCsv,
  exportBookingsCsv,
  iterateBookingsCsv,
} from "@/lib/admin/stats/marketplace";

export async function getAdminStats() {
  const now = new Date();
  const last30 = daysAgo(30);
  const expiringSoon = new Date();
  expiringSoon.setDate(expiringSoon.getDate() + 7);

  const [users, marketplace, learning] = await Promise.all([
    loadUserAdminStats(now, last30, expiringSoon),
    loadMarketplaceAdminStats(last30),
    loadLearningAdminStats(last30),
  ]);

  return {
    generatedAt: now.toISOString(),
    ...users,
    ...marketplace,
    ...learning,
  };
}
