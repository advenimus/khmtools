import { writable, derived } from "svelte/store";

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

export function navigate(r: Route) {
  if (window.location.hash !== `#${r}`) {
    window.location.hash = `#${r}`;
  } else {
    route.set(r);
  }
}

export const isOnboarding = derived(route, ($r) => $r === "onboarding");
