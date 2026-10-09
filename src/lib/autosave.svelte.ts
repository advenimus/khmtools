import { errorMessage } from "./api";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

const DEFAULT_DELAY_MS = 700;

/**
 * Saves `read()` shortly after it stops changing, and flushes any pending
 * save when the owning component is destroyed, so edits are never lost by
 * navigating away.
 */
export function autosave<T>(
  read: () => T | null,
  save: (value: T) => Promise<void>,
  delay = DEFAULT_DELAY_MS
) {
  let saved: string | null = null;
  let status = $state<SaveStatus>("idle");
  let error = $state<string | null>(null);
  let timer: ReturnType<typeof setTimeout> | null = null;
  let pending: { value: T; snapshot: string } | null = null;

  async function run() {
    timer = null;
    const job = pending;
    pending = null;
    if (!job) return;
    status = "saving";
    try {
      await save(job.value);
      saved = job.snapshot;
      status = "saved";
      error = null;
    } catch (e) {
      status = "error";
      error = errorMessage(e);
    }
  }

  $effect(() => {
    const value = read();
    if (value === null) return;
    const snapshot = JSON.stringify(value);
    if (saved === null) {
      saved = snapshot;
      return;
    }
    if (snapshot === saved) return;
    pending = { value: JSON.parse(snapshot) as T, snapshot };
    if (timer) clearTimeout(timer);
    timer = setTimeout(run, delay);
  });

  $effect(() => () => {
    if (timer) {
      clearTimeout(timer);
      run();
    }
  });

  return {
    get status() {
      return status;
    },
    get error() {
      return error;
    },
  };
}
