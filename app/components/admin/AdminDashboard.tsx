"use client";

import AdminStatsPanel from "@/components/admin/AdminStatsPanel";
import AdminSpotlightPanel from "@/components/admin/AdminSpotlightPanel";
import AdminKycPanel from "@/components/admin/AdminKycPanel";
import AdminUsersPanel from "@/components/admin/AdminUsersPanel";
import AdminRentalEquipmentPanel from "@/components/admin/AdminRentalEquipmentPanel";
import AdminLearningPanel from "@/components/admin/AdminLearningPanel";
import AdminSiteReportPanel from "@/components/admin/AdminSiteReportPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminDashboard() {
  return (
    <Tabs defaultValue="stats" className="gap-8">
      <TabsList
        variant="line"
        className="h-auto w-full flex-wrap justify-start rounded-none border-b border-border pb-0"
      >
        <TabsTrigger value="stats">Statistiques</TabsTrigger>
        <TabsTrigger value="report">Rapport</TabsTrigger>
        <TabsTrigger value="kyc">Vérification KYC</TabsTrigger>
        <TabsTrigger value="subscriptions">Abonnements</TabsTrigger>
        <TabsTrigger value="users">Utilisateurs</TabsTrigger>
        <TabsTrigger value="rental">Ampindramo</TabsTrigger>
        <TabsTrigger value="learning">Ampianaro</TabsTrigger>
      </TabsList>

      <TabsContent value="stats">
        <AdminStatsPanel />
      </TabsContent>
      <TabsContent value="report">
        <AdminSiteReportPanel />
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
      <TabsContent value="rental">
        <AdminRentalEquipmentPanel />
      </TabsContent>
      <TabsContent value="learning">
        <AdminLearningPanel />
      </TabsContent>
    </Tabs>
  );
}
