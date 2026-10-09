import { writable } from "svelte/store";

export type ToastKind = "info" | "success" | "warning" | "danger";
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

const STAY_UNTIL_DISMISSED = 0;
const DEFAULT_MS: Record<ToastKind, number> = {
  info: 4000,
  success: 3500,
  warning: 10000,
  danger: STAY_UNTIL_DISMISSED,
};

let nextId = 1;
export const toasts = writable<Toast[]>([]);

export function pushToast(kind: ToastKind, title: string, body?: string, ms = DEFAULT_MS[kind]) {
  const id = nextId++;
  toasts.update((arr) => [...arr, { id, kind, title, body }]);
  if (ms > 0) {
    setTimeout(() => dismissToast(id), ms);
  }
  return id;
}

export function dismissToast(id: number) {
  toasts.update((arr) => arr.filter((t) => t.id !== id));
}
