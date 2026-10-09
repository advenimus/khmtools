import { writable, get } from "svelte/store";
import { api, errorMessage, type LaunchResult, type MediaLauncherSettings } from "../api";
import { pushToast } from "./toasts";

// Kept outside any screen so a run keeps its state if the user navigates away.

export type StepId = "msg" | "obs" | "mmm" | "zoom";
export type StepStatus = "idle" | "running" | "done" | "skipped" | "error";
export interface Step {
  id: StepId;
  label: string;
  status: StepStatus;
  message?: string;
}

export interface Popup {
  open: boolean;
  title: string;
  body: string;
  secondsLeft: number;
}

const SETTLE_MS: Record<Exclude<StepId, "msg">, number> = {
  obs: 2500,
  mmm: 2500,
  zoom: 800,
};
const DEFAULT_POPUP_SECONDS = 5;

const LAUNCHERS: Record<Exclude<StepId, "msg">, { name: string; run: () => Promise<LaunchResult> }> = {
  obs: { name: "OBS Studio", run: api.launchObs },
  mmm: { name: "Meeting Media Manager", run: api.launchMediaManager },
  zoom: { name: "Zoom", run: api.launchZoom },
};

export const running = writable(false);
export const steps = writable<Step[]>([]);
export const popup = writable<Popup>({ open: false, title: "", body: "", secondsLeft: 0 });

let closePopupEarly: (() => void) | null = null;

export function planSteps(settings: MediaLauncherSettings, showMessage: boolean): Step[] {
  const out: Step[] = [];
  if (showMessage) out.push({ id: "msg", label: settings.custom_message.title || "Reminder", status: "idle" });
  if (settings.toggles.launch_obs) out.push({ id: "obs", label: "Open OBS Studio", status: "idle" });
  if (settings.toggles.launch_media_manager) out.push({ id: "mmm", label: "Open Meeting Media Manager", status: "idle" });
  if (settings.toggles.launch_zoom) out.push({ id: "zoom", label: "Open Zoom and join", status: "idle" });
  return out;
}

export async function refreshPlan(duringRun = false): Promise<MediaLauncherSettings> {
  const [settings, showMessage] = await Promise.all([
    api.getMediaLauncherSettings(),
    api.shouldShowCustomMessage(),
  ]);
  if (duringRun || !get(running)) steps.set(planSteps(settings, showMessage));
  return settings;
}

function setStep(id: StepId, status: StepStatus, message?: string) {
  steps.update((all) => all.map((s) => (s.id === id ? { ...s, status, message } : s)));
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function dismissPopup() {
  closePopupEarly?.();
}

function showPopup(settings: MediaLauncherSettings): Promise<void> {
  const seconds = settings.custom_message.display_time_seconds || DEFAULT_POPUP_SECONDS;
  return new Promise((resolve) => {
    popup.set({
      open: true,
      title: settings.custom_message.title,
      body: settings.custom_message.message,
      secondsLeft: seconds,
    });
    const tick = setInterval(() => {
      popup.update((p) => ({ ...p, secondsLeft: Math.max(0, p.secondsLeft - 1) }));
    }, 1000);
    const finish = () => {
      clearInterval(tick);
      clearTimeout(timeout);
      closePopupEarly = null;
      popup.set({ open: false, title: "", body: "", secondsLeft: 0 });
      resolve();
    };
    const timeout = setTimeout(finish, seconds * 1000);
    closePopupEarly = finish;
  });
}

async function runStep(step: Step, settings: MediaLauncherSettings): Promise<boolean> {
  setStep(step.id, "running");
  if (step.id === "msg") {
    await showPopup(settings);
    setStep(step.id, "done");
    return true;
  }
  const launcher = LAUNCHERS[step.id];
  const result = await launcher.run();
  if (!result.success) {
    setStep(step.id, "error", result.message);
    return false;
  }
  await sleep(SETTLE_MS[step.id]);
  setStep(step.id, "done");
  return true;
}

function reportOutcome(failed: Step[]) {
  if (failed.length === 0) {
    pushToast("success", "Meeting started", "Everything opened.");
    return;
  }
  const names = failed.map((s) => LAUNCHERS[s.id as Exclude<StepId, "msg">]?.name ?? s.label);
  pushToast(
    "danger",
    `${names.join(", ")} didn't start`,
    "See the red step on the Start Meeting screen for what to fix."
  );
}

export async function runSequence() {
  if (get(running)) return;
  running.set(true);
  try {
    const settings = await refreshPlan(true);
    const plan = get(steps);
    if (plan.length === 0) {
      pushToast("warning", "Nothing to start", "Turn on at least one tool in Settings → Media Launcher.");
      return;
    }
    const failed: Step[] = [];
    for (const step of plan) {
      const ok = await runStep(step, settings);
      if (!ok) failed.push(step);
    }
    reportOutcome(failed);
  } catch (e) {
    steps.update((all) =>
      all.map((s) =>
        s.status === "running"
          ? { ...s, status: "error", message: errorMessage(e) }
          : s.status === "idle"
            ? { ...s, status: "skipped" }
            : s
      )
    );
    pushToast("danger", "Start Meeting stopped", errorMessage(e));
  } finally {
    running.set(false);
  }
}
