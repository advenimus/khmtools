import { writable, type Writable } from "svelte/store";
import { api, type ThemeMode } from "../api";

export type { ThemeMode };

const CACHE_KEY = "khm-theme";

export const theme: Writable<ThemeMode> = writable<ThemeMode>("system");

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
  try {
    localStorage.setItem(CACHE_KEY, mode);
  } catch {
    // Storage can be unavailable; the saved setting still applies on launch.
  }
}

export function initTheme() {
  theme.subscribe(applyTheme);
  api
    .getAppSettings()
    .then((s) => theme.set(s.theme ?? "system"))
    .catch((e) => console.error("Failed to load theme", e));
}

export async function setTheme(mode: ThemeMode) {
  theme.set(mode);
  const settings = await api.getAppSettings();
  await api.saveAppSettings({ ...settings, theme: mode });
}
