import { loadExperimentIndex } from "../data";
import { escapeHtml } from "../format";

export async function renderExperiments(root: HTMLElement): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Experiments</p>
    </header>
    <nav class="crumb">
      <a href="#/">Accounts</a><span>/</span>
      <span>Experiments</span>
    </nav>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;

  try {
    const data = await loadExperimentIndex();
    if (data.experiments.length === 0) {
      content.innerHTML = `<p class="empty">No experiments yet. Add entries under <span class="mono">web/public/data/experiments/</span>.</p>`;
      return () => undefined;
    }

    content.innerHTML = `
      <h1 class="page-title">Experiments</h1>
      <p class="page-sub">Documented comparisons across posts and approaches.</p>
      <ul class="experiment-list">
        ${data.experiments
          .map(
            (exp) => `
          <li>
            <a class="experiment-link" href="#/experiment/${encodeURIComponent(exp.slug)}">
              ${escapeHtml(exp.name)}
            </a>
          </li>`,
          )
          .join("")}
      </ul>
    `;
  } catch {
    content.innerHTML = `
      <p class="error">
        Could not load <span class="mono">/data/experiments/index.json</span>.
      </p>
    `;
  }

  return () => undefined;
}
