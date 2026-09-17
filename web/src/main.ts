import "./styles.css";
import { onRouteChange, parseRoute } from "./router";
import { renderAccount } from "./views/account";
import { renderHome } from "./views/home";
import { renderPost } from "./views/post";

const root = document.querySelector("#app");
if (!(root instanceof HTMLElement)) {
  throw new Error("Missing #app root");
}
const app: HTMLElement = root;

let cleanup: (() => void) | undefined;

async function render(): Promise<void> {
  cleanup?.();
  cleanup = undefined;

  const route = parseRoute();
  if (route.name === "home") {
    cleanup = await renderHome(app);
    return;
  }
  if (route.name === "account") {
    cleanup = await renderAccount(app, route.id);
    return;
  }
  if (route.name === "post") {
    cleanup = await renderPost(app, route.id);
    return;
  }

  app.innerHTML = `
    <header class="site-header">
      <a class="brand" href="#/">Attention</a>
    </header>
    <p class="error">Page not found. <a href="#/">Back to accounts</a></p>
  `;
}

onRouteChange(() => {
  void render();
});
void render();
