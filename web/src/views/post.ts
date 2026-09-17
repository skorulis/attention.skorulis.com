import type { Chart } from "chart.js";
import { createLineChart, destroyChart, type SeriesInput } from "../charts";
import { loadAccount, loadPost } from "../data";
import { escapeHtml, formatDateTime, formatNumber, metricBits } from "../format";
import type { MetricPoint } from "../types";

const METRIC_KEYS = ["likes", "views", "comments", "reposts", "quotes"] as const;

function seriesWithData(points: MetricPoint[]): SeriesInput[] {
  const result: SeriesInput[] = [];
  for (const key of METRIC_KEYS) {
    const values = points.map((p) => p[key]);
    if (values.some((v) => v !== null)) {
      result.push({
        label: key.charAt(0).toUpperCase() + key.slice(1),
        values,
      });
    }
  }
  return result;
}

export async function renderPost(root: HTMLElement, postId: string): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Post</p>
    </header>
    <nav class="crumb">
      <a href="#/">Accounts</a><span>/</span>
      <a id="crumb-account" href="#/">…</a><span>/</span>
      <span>Post</span>
    </nav>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;
  const crumbAccount = root.querySelector("#crumb-account") as HTMLAnchorElement;
  let chart: Chart | null = null;

  try {
    const post = await loadPost(postId);
    let handle = post.accountId;
    try {
      const account = await loadAccount(post.accountId);
      handle = account.handle;
    } catch {
      // keep account id in crumb if account file missing
    }

    crumbAccount.textContent = `@${handle}`;
    crumbAccount.href = `#/account/${encodeURIComponent(post.accountId)}`;

    const external = post.url
      ? `<p class="page-sub"><a class="external" href="${escapeHtml(post.url)}" target="_blank" rel="noopener">View on ${escapeHtml(post.platform)} ↗</a></p>`
      : "";

    content.innerHTML = `
      <h1 class="page-title">Post engagement</h1>
      <p class="page-sub">${escapeHtml(post.text ?? "(no text)")}</p>
      ${external}
      <p class="meta-row" style="margin-bottom:1.25rem">
        <span class="pill">${escapeHtml(post.platform)}</span>
        <span>posted ${escapeHtml(formatDateTime(post.postedAt))}</span>
        <span class="mono">${escapeHtml(metricBits(post))}</span>
      </p>
      <section class="panel">
        <h2 class="panel-title">Daily metrics</h2>
        <div class="chart-wrap"><canvas id="metrics-chart"></canvas></div>
      </section>
      <section class="panel">
        <h2 class="panel-title">Latest</h2>
        <div class="meta-row">
          <div><span class="stat-label">Likes</span><div class="stat">${escapeHtml(formatNumber(post.likes))}</div></div>
          <div><span class="stat-label">Views</span><div class="stat">${escapeHtml(formatNumber(post.views))}</div></div>
          <div><span class="stat-label">Comments</span><div class="stat">${escapeHtml(formatNumber(post.comments))}</div></div>
          <div><span class="stat-label">Reposts</span><div class="stat">${escapeHtml(formatNumber(post.reposts))}</div></div>
          <div><span class="stat-label">Quotes</span><div class="stat">${escapeHtml(formatNumber(post.quotes))}</div></div>
        </div>
      </section>
    `;

    const canvas = content.querySelector("#metrics-chart");
    const series = seriesWithData(post.series);
    if (canvas instanceof HTMLCanvasElement && series.length > 0 && post.series.length > 0) {
      chart = createLineChart(
        canvas,
        post.series.map((p) => p.recordedOn),
        series,
      );
    } else if (canvas instanceof HTMLCanvasElement) {
      canvas.parentElement!.innerHTML = `<p class="empty">No metric snapshots for this post yet.</p>`;
    }
  } catch {
    content.innerHTML = `<p class="error">Could not load post <span class="mono">${escapeHtml(postId)}</span>.</p>`;
  }

  return () => destroyChart(chart);
}
