import { loadPrinciples } from "../data";
import { escapeHtml } from "../format";

export async function renderPrinciples(root: HTMLElement): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Principles</p>
    </header>
    <nav class="crumb">
      <a href="#/">Accounts</a><span>/</span>
      <span>Principles</span>
    </nav>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;

  try {
    const data = await loadPrinciples();
    if (data.principles.length === 0) {
      content.innerHTML = `<p class="empty">No principles yet. Add them to <span class="mono">web/public/data/principles.json</span>.</p>`;
      return () => undefined;
    }

    content.innerHTML = `
      <h1 class="page-title">Principles</h1>
      <p class="page-sub">The rules every post is measured against. <a href="#/experiments">Experiments</a> are the scorecard.</p>
      <ol class="principle-list">
        ${data.principles
          .map(
            (p, i) => `
          <li class="principle-card">
            <span class="principle-number">${String(i + 1).padStart(2, "0")}</span>
            <h2>${escapeHtml(p.title)}</h2>
            <p class="principle-summary">${escapeHtml(p.summary)}</p>
            <p>${escapeHtml(p.why)}</p>
            <ul class="principle-tactics">
              ${p.tactics.map((t) => `<li>${escapeHtml(t)}</li>`).join("")}
            </ul>
            ${
              p.images.length > 0
                ? `<div class="principle-images">
              ${p.images
                .map(
                  (img) => `<a href="${escapeHtml(img)}" target="_blank"><img src="${escapeHtml(img)}" alt="${escapeHtml(p.title)}" loading="lazy"></a>`,
                )
                .join("")}
            </div>`
                : ""
            }
          </li>`,
          )
          .join("")}
      </ol>
    `;
  } catch {
    content.innerHTML = `
      <p class="error">
        Could not load <span class="mono">/data/principles.json</span>.
      </p>
    `;
  }

  return () => undefined;
}
