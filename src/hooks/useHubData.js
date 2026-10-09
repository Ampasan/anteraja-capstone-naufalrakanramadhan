import { useState, useEffect } from 'react';

export function useHubData() {
  const [metrics, setMetrics] = useState([]);
  const [locations, setLocations] = useState([]);
  const [aiSummary, setAiSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      try {
        const [metricsRes, locationsRes, aiRes] = await Promise.all([
          fetch('/data/metrics.json'),
          fetch('/data/locations.json'),
          fetch('/data/ai-summary.json'),
        ]);

        if (!metricsRes.ok || !locationsRes.ok || !aiRes.ok) {
          throw new Error('Gagal memuat data.');
        }

        const [metricsData, locationsData, aiData] = await Promise.all([
          metricsRes.json(),
          locationsRes.json(),
          aiRes.json(),
        ]);

        setMetrics(metricsData);
        setLocations(locationsData);
        setAiSummary(aiData);
      } catch (err) {
        setError(err.message || 'Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    }

    fetchAll();
  }, []);

  // Merge metrics + locations by hub_id
  const hubs = metrics.map((m) => {
    const loc = locations.find((l) => l.hub_id === m.hub_id);
    return {
      hub_id: m.hub_id,
      name: loc?.name ?? m.hub_id,
      lat: loc?.lat ?? null,
      lng: loc?.lng ?? null,
      mean_dwell: m.mean_dwell,
      min_dwell: m.min_dwell,
      max_dwell: m.max_dwell,
      completed_visits: m.completed_visits,
      priority: m.priority,
    };
  });

  // Global KPIs — derived from raw numeric data
  const totalHubs = hubs.length;
  const completedVisits = hubs.reduce((sum, h) => sum + h.completed_visits, 0);
  const priorityHubCount = hubs.filter((h) => h.priority).length;

  // Global mean: weighted average from completed visits
  const globalMeanDwell =
    completedVisits > 0
      ? hubs.reduce((sum, h) => sum + h.mean_dwell * h.completed_visits, 0) / completedVisits
      : 0;

  // Top 3 by mean_dwell (numeric sort, descending)
  const top3Hubs = [...hubs]
    .sort((a, b) => b.mean_dwell - a.mean_dwell)
    .slice(0, 3);

  return {
    hubs,
    top3Hubs,
    kpis: {
      totalHubs,
      completedVisits,
      globalMeanDwell,
      priorityHubCount,
    },
    aiSummary,
    loading,
    error,
  };
}
