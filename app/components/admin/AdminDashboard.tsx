"use client";

import AdminStatsPanel from "@/components/admin/AdminStatsPanel";
import AdminSpotlightPanel from "@/components/admin/AdminSpotlightPanel";
import AdminKycPanel from "@/components/admin/AdminKycPanel";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="stats" className="gap-8">
      <TabsList variant="line" className="w-full justify-start border-b border-border rounded-none pb-0">
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
        <TabsTrigger value="kyc">Vérification KYC</TabsTrigger>
        <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <AdminStatsPanel />
      </TabsContent>
      <TabsContent value="kyc">
        <AdminKycPanel />
      </TabsContent>
      <TabsContent value="subscriptions">
        <AdminSpotlightPanel />
      </TabsContent>
      <TabsContent value="users">
        <AdminUsersPanel />
      </TabsContent>
    </Tabs>
  );
}
