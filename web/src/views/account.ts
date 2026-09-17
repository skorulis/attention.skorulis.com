import type { Chart } from "chart.js";
import { createLineChart, destroyChart } from "../charts";
import { loadAccount } from "../data";
import { escapeHtml, formatDate, formatDateTime, formatNumber, metricBits } from "../format";

export async function renderAccount(
  root: HTMLElement,
  accountId: string,
): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Account</p>
    </header>
    <nav class="crumb"><a href="#/">Accounts</a><span>/</span><span id="crumb-name">…</span></nav>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;
  const crumb = root.querySelector("#crumb-name") as HTMLElement;
  let chart: Chart | null = null;

  try {
    const account = await loadAccount(accountId);
    crumb.textContent = `@${account.handle}`;

    const postsHtml =
      account.posts.length === 0
        ? `<p class="empty">No posts stored for this account yet.</p>`
        : `<ul class="post-list">${account.posts
            .map(
              (post) => `
            <li>
              <a class="post-link" href="#/post/${post.id}">
                <p class="post-text">${escapeHtml(post.text ?? "(no text)")}</p>
                <div class="meta-row">
                  <span>${escapeHtml(formatDate(post.postedAt))}</span>
                </div>
                <div class="post-metrics">${escapeHtml(metricBits(post))}</div>
              </a>
            </li>`,
            )
            .join("")}</ul>`;

    content.innerHTML = `
      <h1 class="page-title">@${escapeHtml(account.handle)}</h1>
      <p class="page-sub">
        <span class="pill">${escapeHtml(account.platform)}</span>
        &nbsp; ${escapeHtml(formatNumber(account.followers))} followers ·
        updated ${escapeHtml(formatDateTime(account.updatedAt))}
      </p>
      <section class="panel">
        <h2 class="panel-title">Follower growth</h2>
        <div class="chart-wrap"><canvas id="followers-chart"></canvas></div>
      </section>
      <section class="panel">
        <h2 class="panel-title">Posts</h2>
        ${postsHtml}
      </section>
    `;

    const canvas = content.querySelector("#followers-chart");
    if (canvas instanceof HTMLCanvasElement && account.followerSeries.length > 0) {
      chart = createLineChart(
        canvas,
        account.followerSeries.map((p) => p.recordedOn),
        [
          {
            label: "Followers",
            values: account.followerSeries.map((p) => p.followers),
          },
        ],
        { fill: true },
      );
    } else if (canvas instanceof HTMLCanvasElement) {
      canvas.parentElement!.innerHTML = `<p class="empty">No follower snapshots yet.</p>`;
    }
  } catch {
    crumb.textContent = accountId;
    content.innerHTML = `<p class="error">Could not load account <span class="mono">${escapeHtml(accountId)}</span>.</p>`;
  }

  return () => destroyChart(chart);
}
