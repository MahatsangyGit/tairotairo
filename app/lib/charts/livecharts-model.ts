/**
 * Modèle cartesian porté de LiveCharts2
 * https://github.com/Live-Charts/LiveCharts2
 *
 * LiveCharts2 cible .NET (WPF, WinUI, MAUI, Avalonia, Blazor). Tairo est Next.js :
 * on reprend l’API publique (CartesianChart + LineSeries + ColumnSeries +
 * tooltips / légende cliquable), rendue en SVG interactif.
 */

export type LiveChartsGeometry = "line" | "column";

export type LiveChartsSeries = {
  type: LiveChartsGeometry;
  name: string;
  values: number[];
  /** Stroke / fill principal (LiveCharts2 Stroke / Fill). */
  color: string;
  /** Trait distinct (accessibilité, pas seulement la couleur). */
  strokeDasharray?: string;
  /** Surface sous la courbe (LineSeries.Fill). */
  fillOpacity?: number;
  geometrySize?: number;
};

export function liveChartsMax(series: LiveChartsSeries[]): number {
  let max = 0;
  for (const s of series) {
    for (const v of s.values) {
      if (v > max) max = v;
    }
  }
  return max;
}
