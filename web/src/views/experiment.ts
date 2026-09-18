import { loadExperiment, loadPost } from "../data";
import { escapeHtml, formatDate, metricBits } from "../format";
import type { PostData } from "../types";

function averageMetric(
  posts: PostData[],
  key: "likes" | "views",
): number | null {
  const values = posts
    .map((p) => p[key])
    .filter((v): v is number => v !== null);
  if (values.length === 0) {
    return null;
  }
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function formatAverage(value: number | null): string {
  if (value === null) {
    return "—";
  }
  return new Intl.NumberFormat("en", {
    maximumFractionDigits: 1,
  }).format(value);
}

async function loadPostsForArm(postIds: number[]): Promise<PostData[]> {
  const posts: PostData[] = [];
  for (const id of postIds) {
    posts.push(await loadPost(String(id)));
  }
  return posts;
}

function renderArmPosts(posts: PostData[]): string {
  if (posts.length === 0) {
    return `<p class="empty">No posts in this arm.</p>`;
  }

  return `<ul class="post-list">${posts
    .map(
      (post) => `
    <li>
      <a class="post-link" href="#/post/${post.id}">
        <p class="post-text">${escapeHtml(post.text ?? "(no text)")}</p>
        <div class="meta-row">
          <span>${escapeHtml(formatDate(post.postedAt))}</span>
          <span class="pill">${escapeHtml(post.platform)}</span>
        </div>
        <div class="post-metrics">${escapeHtml(metricBits(post))}</div>
      </a>
    </li>`,
    )
    .join("")}</ul>`;
}

export async function renderExperiment(
  root: HTMLElement,
  slug: string,
): Promise<() => void> {
  root.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
      <p class="nav-meta">Experiment</p>
    </header>
    <nav class="crumb">
      <a href="#/">Accounts</a><span>/</span>
      <a href="#/experiments">Experiments</a><span>/</span>
      <span id="crumb-name">…</span>
    </nav>
    <div id="content"><p class="empty">Loading…</p></div>
  `;

  const content = root.querySelector("#content") as HTMLElement;
  const crumb = root.querySelector("#crumb-name") as HTMLElement;

  try {
    const experiment = await loadExperiment(slug);
    crumb.textContent = experiment.name;

    const armSections: string[] = [];
    for (const arm of experiment.arms) {
      let posts: PostData[];
      try {
        posts = await loadPostsForArm(arm.postIds);
      } catch {
        armSections.push(`
          <section class="panel experiment-arm">
            <h2 class="panel-title">${escapeHtml(arm.label)}</h2>
            <p class="error">Could not load one or more posts for this arm.</p>
          </section>
        `);
        continue;
      }

      const avgLikes = averageMetric(posts, "likes");
      const avgViews = averageMetric(posts, "views");

      armSections.push(`
        <section class="panel experiment-arm">
          <h2 class="panel-title">${escapeHtml(arm.label)}</h2>
          <p class="arm-summary">
            ${posts.length} post${posts.length === 1 ? "" : "s"} ·
            avg likes <span class="mono">${escapeHtml(formatAverage(avgLikes))}</span>
            · avg views <span class="mono">${escapeHtml(formatAverage(avgViews))}</span>
          </p>
          ${renderArmPosts(posts)}
        </section>
      `);
    }

    content.innerHTML = `
      <h1 class="page-title">${escapeHtml(experiment.name)}</h1>
      <section class="panel">
        <h2 class="panel-title">Introduction</h2>
        <p class="experiment-prose">${escapeHtml(experiment.introduction)}</p>
      </section>
      <div class="experiment-arms">
        ${armSections.join("")}
      </div>
      <section class="panel">
        <h2 class="panel-title">Results</h2>
        <p class="experiment-prose">${escapeHtml(experiment.results)}</p>
      </section>
    `;
  } catch {
    crumb.textContent = slug;
    content.innerHTML = `
      <p class="error">
        Could not load experiment <span class="mono">${escapeHtml(slug)}</span>.
      </p>
    `;
  }

  return () => undefined;
}
