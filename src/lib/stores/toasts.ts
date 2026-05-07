import { writable } from "svelte/store";

export type ToastKind = "info" | "success" | "warning" | "danger";
export interface Toast {
  id: number;
  kind: ToastKind;
  title: string;
  body?: string;
}

let nextId = 1;
export const toasts = writable<Toast[]>([]);

export function pushToast(kind: ToastKind, title: string, body?: string, ms = 3500) {
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
