import { writable } from "svelte/store";

export type Route =
  | "dashboard"
  | "attendance"
  | "zoom"
  | "media"
  | "settings"
  | "onboarding";

const VALID: Route[] = [
  "dashboard",
  "attendance",
  "zoom",
  "media",
  "settings",
  "onboarding",
];

function readHash(): Route {
  const raw = (window.location.hash || "#dashboard").slice(1);
  return (VALID.includes(raw as Route) ? raw : "dashboard") as Route;
}

export const route = writable<Route>(readHash());

window.addEventListener("hashchange", () => route.set(readHash()));

/** `replace` swaps the current history entry so Back can't return to it. */
export function navigate(r: Route, { replace = false } = {}) {
  const hash = `#${r}`;
  if (replace) {
    history.replaceState(null, "", hash);
    route.set(r);
  } else if (window.location.hash !== hash) {
    window.location.hash = hash;
  } else {
    route.set(r);
  }
}
