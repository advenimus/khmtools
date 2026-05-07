import { writable, type Writable } from "svelte/store";
import { invoke } from "@tauri-apps/api/core";

export type ThemeMode = "system" | "light" | "dark";

export const theme: Writable<ThemeMode> = writable<ThemeMode>("system");

function applyTheme(mode: ThemeMode) {
  document.documentElement.setAttribute("data-theme", mode);
}

export function initTheme() {
  invoke<{ theme: ThemeMode }>("get_app_settings")
    .then((s) => {
      const mode = s?.theme ?? "system";
      theme.set(mode);
      applyTheme(mode);
    })
    .catch(() => {
      applyTheme("system");
    });

  theme.subscribe((mode) => applyTheme(mode));
}

export async function setTheme(mode: ThemeMode) {
  theme.set(mode);
  applyTheme(mode);
  try {
    const settings = await invoke<Record<string, unknown>>("get_app_settings");
    await invoke("save_app_settings", { settings: { ...settings, theme: mode } });
  } catch (e) {
    console.error("Failed to persist theme", e);
  }
}
