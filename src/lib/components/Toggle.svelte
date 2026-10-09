<script lang="ts">
  interface Props {
    checked?: boolean;
    label?: string;
    description?: string;
    disabled?: boolean;
    onchange?: (checked: boolean) => void;
  }
  let {
    checked = $bindable(false),
    label = "",
    description = "",
    disabled = false,
    onchange,
  }: Props = $props();

  const uid = Math.random().toString(36).slice(2);
  const labelId = `toggle-label-${uid}`;
  const descId = `toggle-desc-${uid}`;
</script>

<div class="flex items-start gap-3" class:opacity-60={disabled}>
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-labelledby={labelId}
    aria-describedby={description ? descId : undefined}
    {disabled}
    onclick={() => { checked = !checked; onchange?.(checked); }}
    class="relative mt-0.5 h-5 w-9 shrink-0 rounded-full border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 disabled:cursor-not-allowed {checked
      ? 'border-brand-solid bg-brand-solid'
      : 'border-control-off bg-surface-2'}"
  >
    <span
      class="absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all"
      class:left-0.5={!checked}
      class:left-[18px]={checked}
    ></span>
  </button>
  <div class="flex-1">
    <button
      type="button"
      id={labelId}
      class="text-left text-sm text-text"
      tabindex="-1"
      {disabled}
      onclick={() => { checked = !checked; onchange?.(checked); }}
    >{label}</button>
    {#if description}
      <div id={descId} class="text-xs text-text-mute">{description}</div>
    {/if}
  </div>
</div>
