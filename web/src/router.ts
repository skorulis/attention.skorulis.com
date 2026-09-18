export type Route =
  | { name: "home" }
  | { name: "account"; id: string }
  | { name: "post"; id: string }
  | { name: "experiments" }
  | { name: "experiment"; slug: string }
  | { name: "notfound" };

export function parseRoute(hash = window.location.hash): Route {
  const raw = hash.replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);

  if (parts.length === 0) {
    return { name: "home" };
  }

  if (parts[0] === "account" && parts[1]) {
    return { name: "account", id: decodeURIComponent(parts[1]) };
  }

  if (parts[0] === "post" && parts[1]) {
    return { name: "post", id: decodeURIComponent(parts[1]) };
  }

  if (parts[0] === "experiments" && parts.length === 1) {
    return { name: "experiments" };
  }

  if (parts[0] === "experiment" && parts[1]) {
    return { name: "experiment", slug: decodeURIComponent(parts[1]) };
  }

  return { name: "notfound" };
}

export function onRouteChange(handler: () => void): () => void {
  const listener = () => handler();
  window.addEventListener("hashchange", listener);
  return () => window.removeEventListener("hashchange", listener);
}
