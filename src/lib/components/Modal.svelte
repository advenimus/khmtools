<script lang="ts">
  import { tick } from "svelte";

  interface Props {
    open: boolean;
    title?: string;
    onclose?: () => void;
    children?: any;
    footer?: any;
    size?: "sm" | "md" | "lg";
  }
  let { open, title = "", onclose, children, footer, size = "md" }: Props = $props();

  const widthCls = $derived({ sm: "max-w-sm", md: "max-w-lg", lg: "max-w-2xl" }[size]);
  const titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
  const FOCUSABLE =
    'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  let panel: HTMLDivElement | undefined = $state();
  let returnFocusTo: HTMLElement | null = null;

  $effect(() => {
    if (!open) return;
    returnFocusTo = document.activeElement as HTMLElement | null;
    tick().then(() => {
      const first = panel?.querySelector<HTMLElement>(FOCUSABLE);
      (first ?? panel)?.focus();
    });
    return () => returnFocusTo?.focus?.();
  });

  function onkeydown(e: KeyboardEvent) {
    if (e.key === "Escape") {
      e.preventDefault();
      onclose?.();
      return;
    }
    if (e.key !== "Tab" || !panel) return;
    const items = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE));
    if (items.length === 0) return;
    const first = items[0];
    const last = items[items.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }
</script>

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
    {onkeydown}
  >
    <div
      bind:this={panel}
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      tabindex="-1"
      class="scale-in flex max-h-[85vh] w-full {widthCls} flex-col rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)] focus:outline-none"
    >
      <div class="flex shrink-0 items-center justify-between gap-3 border-b border-border px-5 py-3.5">
        <div id={titleId} class="break-words text-sm font-semibold">{title}</div>
        {#if onclose}
          <button class="rounded p-1 text-text-mute hover:bg-surface-2 hover:text-text" aria-label="Close" onclick={onclose}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        {/if}
      </div>
      <div class="overflow-y-auto break-words px-5 py-4">{@render children?.()}</div>
      {#if footer}
        <div class="flex shrink-0 justify-end gap-2 border-t border-border px-5 py-3">{@render footer?.()}</div>
      {/if}
    </div>
  </div>
{/if}
