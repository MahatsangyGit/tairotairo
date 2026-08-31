"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetchJson } from "@/lib/api-client";
import CartesianChart from "@/components/charts/CartesianChart";
import type { AdminSiteReport } from "@/lib/admin-site-report";
import type { LiveChartsSeries } from "@/lib/charts/livecharts-model";

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: number;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-brand-100 bg-brand-50/50 p-5">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-2xl font-bold text-foreground">
        {value.toLocaleString("fr-MG")}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export default function AdminSiteReportPanel() {
  const [report, setReport] = useState<AdminSiteReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetchJson<AdminSiteReport>("/api/admin/report");
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Fetch on mount / dependency change
    // eslint-disable-next-line react-hooks/set-state-in-effect -- client data load
    void load();
  }, [load]);

  if (loading && !report) {
    return <p className="text-muted-foreground">Chargement du rapport…</p>;
  }
  if (!report) {
    return <p className="text-destructive">{error ?? "Rapport indisponible"}</p>;
  }

  const viewsSeries: LiveChartsSeries[] = [
    {
      type: "line",
      name: "Vues vidéo",
      values: report.charts.views,
      color: "#0aa0a0",
      fillOpacity: 0.2,
      geometrySize: 3,
    },
    {
      type: "line",
      name: "Spectateurs uniques",
      values: report.charts.uniqueViewers,
      color: "#0080FF",
      strokeDasharray: "6 4",
      geometrySize: 3,
    },
  ];

  const activitySeries: LiveChartsSeries[] = [
    {
      type: "line",
      name: "Vues Ampianaro",
      values: report.charts.views,
      color: "#0aa0a0",
      fillOpacity: 0.15,
    },
    {
      type: "line",
      name: "Réservations",
      values: report.charts.bookings,
      color: "#e8b5ac",
      strokeDasharray: "4 3",
    },
    {
      type: "line",
      name: "Nouveaux comptes",
      values: report.charts.newUsers,
      color: "#057676",
      strokeDasharray: "2 3",
    },
  ];

  const topLessonSeries: LiveChartsSeries[] = [
    {
      type: "column",
      name: "Vues",
      values: report.charts.topLessons.map((l) => l.views),
      color: "#0aa0a0",
    },
  ];

  const courseSeries: LiveChartsSeries[] = [
    {
      type: "column",
      name: "Vues",
      values: report.charts.viewsByCourse.map((c) => c.views),
      color: "#0080FF",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">
            Rapport du site
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Chiffres des 30 derniers jours, y compris les vues vidéo Ampianaro.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="text-sm font-medium text-brand-600 hover:text-brand-700"
        >
          Actualiser
        </button>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label="Vues vidéo"
          value={report.kpis.videoViewsTotal}
          hint={`${report.kpis.viewsLast30.toLocaleString("fr-MG")} sur 30 j`}
        />
        <Kpi
          label="Spectateurs uniques"
          value={report.kpis.uniqueViewers}
        />
        <Kpi
          label="Inscriptions cours"
          value={report.kpis.enrollments}
          hint={`${report.kpis.coursesPublished} formations publiées`}
        />
        <Kpi
          label="Leçons terminées"
          value={report.kpis.completions}
          hint={`${report.kpis.lessonsWithVideo} leçons avec vidéo`}
        />
      </section>

      <CartesianChart
        title="Vues Ampianaro (30 jours)"
        labels={report.charts.labels}
        series={viewsSeries}
      />
      <CartesianChart
        title="Activité du site (30 jours)"
        labels={report.charts.labels}
        series={activitySeries}
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <CartesianChart
          title="Leçons les plus vues"
          labels={
            report.charts.topLessons.length
              ? report.charts.topLessons.map((l) => l.title)
              : ["—"]
          }
          series={
            report.charts.topLessons.length
              ? topLessonSeries
              : [{ ...topLessonSeries[0], values: [0] }]
          }
        />
        <CartesianChart
          title="Vues par formation"
          labels={
            report.charts.viewsByCourse.length
              ? report.charts.viewsByCourse.map((c) => c.title)
              : ["—"]
          }
          series={
            report.charts.viewsByCourse.length
              ? courseSeries
              : [{ ...courseSeries[0], values: [0] }]
          }
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Graphiques cartesian interactifs (séries, tooltip, légende) d’après le
        modèle{" "}
        <a
          className="text-brand-600 hover:underline"
          href="https://github.com/Live-Charts/LiveCharts2"
          target="_blank"
          rel="noreferrer"
        >
          LiveCharts2
        </a>
        . Une vue est comptée après 3 s de lecture, au plus une fois par compte
        et par leçon toutes les 6 heures.
      </p>
    </div>
  );
}
