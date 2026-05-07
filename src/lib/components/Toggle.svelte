<script lang="ts">
  interface Props {
    checked?: boolean;
    label?: string;
    description?: string;
    onchange?: (checked: boolean) => void;
  }
  let { checked = $bindable(false), label = "", description = "", onchange }: Props = $props();
</script>

<label class="flex cursor-pointer items-start gap-3">
  <button
    type="button"
    role="switch"
    aria-label={label || "Toggle"}
    aria-checked={checked}
    onclick={() => { checked = !checked; onchange?.(checked); }}
    class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full border border-border transition"
    class:bg-brand={checked}
    class:bg-surface-2={!checked}
  >
    <span
      class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
      class:left-0.5={!checked}
      class:left-[18px]={checked}
    ></span>
  </button>
  <div class="flex-1">
    <div class="text-sm text-text">{label}</div>
    {#if description}
      <div class="text-xs text-text-mute">{description}</div>
    {/if}
  </div>
</label>
