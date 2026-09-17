import type { Chart } from "chart.js";
import { createLineChart, destroyChart } from "../charts";
import { loadIndex } from "../data";
import { escapeHtml, formatDateTime, formatNumber } from "../format";

export async function renderHome(root: HTMLElement): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Account &amp; post metrics</p>
    </header>
    <p class="page-sub">Follower trends and post engagement across synced accounts.</p>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;
  const charts: Chart[] = [];

  try {
    const data = await loadIndex();
    if (data.accounts.length === 0) {
      content.innerHTML = `<p class="empty">No accounts in the export yet. Run <span class="mono">npm run sync</span>.</p>`;
      return () => undefined;
    }

    content.innerHTML = `
      <p class="nav-meta" style="margin-bottom:1rem">Exported ${escapeHtml(formatDateTime(data.exportedAt))}</p>
      <div class="account-grid" id="accounts"></div>
    `;

    const grid = content.querySelector("#accounts") as HTMLElement;
    for (const account of data.accounts) {
      const card = document.createElement("a");
      card.className = "account-card";
      card.href = `#/account/${encodeURIComponent(account.id)}`;
      card.innerHTML = `
        <div>
          <h2>@${escapeHtml(account.handle)}</h2>
          <div class="meta-row">
            <span class="pill">${escapeHtml(account.platform)}</span>
            <span>updated ${escapeHtml(formatDateTime(account.updatedAt))}</span>
          </div>
        </div>
        <div>
          <span class="stat-label">Followers</span>
          <div class="stat">${escapeHtml(formatNumber(account.followers))}</div>
          <div class="chart-wrap spark"><canvas></canvas></div>
        </div>
      `;
      grid.appendChild(card);

      const canvas = card.querySelector("canvas");
      if (canvas instanceof HTMLCanvasElement && account.followerSeries.length > 0) {
        charts.push(
          createLineChart(
            canvas,
            account.followerSeries.map((p) => p.recordedOn),
            [
              {
                label: "Followers",
                values: account.followerSeries.map((p) => p.followers),
              },
            ],
            { sparkline: true, fill: true },
          ),
        );
      }
    }
  } catch {
    content.innerHTML = `
      <p class="error">
        Could not load <span class="mono">/data/index.json</span>.
        Run <span class="mono">npm run export</span> (or <span class="mono">npm run sync</span>) then refresh.
      </p>
    `;
  }

  return () => {
    for (const chart of charts) {
      destroyChart(chart);
    }
  };
}
