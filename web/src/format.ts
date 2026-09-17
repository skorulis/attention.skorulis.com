export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined) {
    return "—";
  }
  return new Intl.NumberFormat("en", { maximumFractionDigits: 0 }).format(value);
}

export function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatDateTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function metricBits(metrics: {
  likes: number | null;
  views: number | null;
  comments: number | null;
  reposts: number | null;
  quotes: number | null;
}): string {
  const parts: string[] = [];
  if (metrics.likes !== null) {
    parts.push(`${formatNumber(metrics.likes)} likes`);
  }
  if (metrics.views !== null) {
    parts.push(`${formatNumber(metrics.views)} views`);
  }
  if (metrics.comments !== null) {
    parts.push(`${formatNumber(metrics.comments)} comments`);
  }
  if (metrics.reposts !== null) {
    parts.push(`${formatNumber(metrics.reposts)} reposts`);
  }
  if (metrics.quotes !== null) {
    parts.push(`${formatNumber(metrics.quotes)} quotes`);
  }
  return parts.join(" · ");
}
