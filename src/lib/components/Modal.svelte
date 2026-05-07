<script lang="ts">
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
</script>

{#if open}
  <div
    role="presentation"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-6"
    onclick={(e) => { if (e.target === e.currentTarget) onclose?.(); }}
  >
    <div
      role="dialog"
      aria-modal="true"
      class="scale-in flex w-full {widthCls} flex-col rounded-xl border border-border bg-surface shadow-[var(--shadow-lg)]"
    >
      <div class="flex items-center justify-between border-b border-border px-5 py-3.5">
        <div class="text-sm font-semibold">{title}</div>
        <button class="rounded p-1 text-text-mute hover:bg-surface-2 hover:text-text" aria-label="Close" onclick={onclose}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>
      <div class="px-5 py-4">{@render children?.()}</div>
      {#if footer}
        <div class="flex justify-end gap-2 border-t border-border px-5 py-3">{@render footer?.()}</div>
      {/if}
    </div>
  </div>
{/if}
