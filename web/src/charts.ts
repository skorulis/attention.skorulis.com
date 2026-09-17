import {
  Chart,
  LineController,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Filler,
  Legend,
  Tooltip,
  type ChartConfiguration,
  type ChartDataset,
} from "chart.js";

Chart.register(
  LineController,
  LineElement,
  LinearScale,
  CategoryScale,
  PointElement,
  Filler,
  Legend,
  Tooltip,
);

const RESOLVED = {
  ink: "#14201a",
  muted: "#6a7d71",
  line: "rgba(20, 32, 26, 0.12)",
  chart: ["#0d6e56", "#1d4e89", "#9a3412", "#6b21a8", "#0f766e"],
};

export type SeriesInput = {
  label: string;
  values: (number | null)[];
};

function baseOptions(sparkline: boolean): ChartConfiguration<"line">["options"] {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: sparkline ? false : { duration: 450 },
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        display: !sparkline,
        labels: {
          color: RESOLVED.ink,
          font: { family: "'Work Sans', sans-serif", size: 12 },
          boxWidth: 12,
        },
      },
      tooltip: { enabled: !sparkline },
    },
    scales: {
      x: {
        display: !sparkline,
        grid: { color: RESOLVED.line },
        ticks: {
          color: RESOLVED.muted,
          maxRotation: 0,
          autoSkipPadding: 12,
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
        },
      },
      y: {
        display: !sparkline,
        beginAtZero: false,
        grid: { color: RESOLVED.line },
        ticks: {
          color: RESOLVED.muted,
          font: { family: "'IBM Plex Mono', monospace", size: 10 },
        },
      },
    },
    elements: {
      point: { radius: sparkline ? 0 : 3, hoverRadius: sparkline ? 0 : 5 },
      line: { tension: 0.25, borderWidth: sparkline ? 1.5 : 2 },
    },
  };
}

export function createLineChart(
  canvas: HTMLCanvasElement,
  labels: string[],
  series: SeriesInput[],
  options?: { sparkline?: boolean; fill?: boolean },
): Chart {
  const sparkline = options?.sparkline ?? false;
  const fill = options?.fill ?? sparkline;

  const datasets: ChartDataset<"line">[] = series.map((entry, index) => {
    const color = RESOLVED.chart[index % RESOLVED.chart.length] ?? RESOLVED.chart[0]!;
    return {
      label: entry.label,
      data: entry.values,
      borderColor: color,
      backgroundColor: fill ? `${color}33` : color,
      fill: fill && index === 0,
      spanGaps: true,
    };
  });

  return new Chart(canvas, {
    type: "line",
    data: { labels, datasets },
    options: baseOptions(sparkline),
  });
}

export function destroyChart(chart: Chart | null | undefined): void {
  chart?.destroy();
}
