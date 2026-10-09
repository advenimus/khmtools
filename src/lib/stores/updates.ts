import { writable } from "svelte/store";
import { api, errorMessage, type UpdateInfo } from "../api";

const RECHECK_MS = 6 * 60 * 60 * 1000;

export const availableUpdate = writable<UpdateInfo | null>(null);
export const bannerDismissed = writable(false);

let timer: ReturnType<typeof setInterval> | null = null;

export async function checkForUpdate(): Promise<UpdateInfo> {
  const info = await api.checkForUpdate();
  availableUpdate.set(info.available ? info : null);
  if (info.available) bannerDismissed.set(false);
  return info;
}

async function quietCheck() {
  try {
    await checkForUpdate();
  } catch (e) {
    console.info("Background update check failed:", errorMessage(e));
  }
}

export function startUpdateChecks() {
  if (timer) return;
  quietCheck();
  timer = setInterval(quietCheck, RECHECK_MS);
}
