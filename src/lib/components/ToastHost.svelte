<script lang="ts">
  import { toasts, dismissToast } from "../stores/toasts";

  const kindCls: Record<string, string> = {
    info: "border-brand/30 bg-surface",
    success: "border-success/40 bg-surface",
    warning: "border-warning/40 bg-surface",
    danger: "border-danger/40 bg-surface",
  };
  const dotCls: Record<string, string> = {
    info: "bg-brand",
    success: "bg-success",
    warning: "bg-warning",
    danger: "bg-danger",
  };
</script>

<div class="pointer-events-none fixed right-5 top-16 z-50 flex w-80 flex-col gap-2">
  {#each $toasts as t (t.id)}
    <div class="pointer-events-auto fade-in flex items-start gap-3 rounded-lg border px-4 py-3 shadow-[var(--shadow-lg)] {kindCls[t.kind]}">
      <span class="mt-1.5 h-2 w-2 shrink-0 rounded-full {dotCls[t.kind]}"></span>
      <div class="flex-1">
        <div class="text-sm font-medium text-text">{t.title}</div>
        {#if t.body}<div class="mt-0.5 text-xs text-text-mute">{t.body}</div>{/if}
      </div>
      <button class="rounded p-0.5 text-text-mute hover:bg-surface-2 hover:text-text" aria-label="Dismiss" onclick={() => dismissToast(t.id)}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
      </button>
    </div>
  {/each}
</div>
