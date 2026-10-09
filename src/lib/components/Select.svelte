<script lang="ts">
  interface Option { value: string; label: string }
  interface Props {
    value?: string;
    options: Option[];
    id?: string;
    disabled?: boolean;
    class?: string;
    onchange?: (e: Event) => void;
    "aria-label"?: string;
  }
  let {
    value = $bindable(""),
    options,
    id,
    disabled = false,
    class: cls = "",
    onchange,
    "aria-label": ariaLabel,
  }: Props = $props();
</script>

<div class="relative {cls}">
  <select
    {id}
    {disabled}
    {onchange}
    aria-label={ariaLabel}
    bind:value
    class="block h-10 w-full appearance-none rounded-md border border-border bg-bg px-3 pr-9 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
  >
    {#each options as opt}
      <option value={opt.value}>{opt.label}</option>
    {/each}
  </select>
  <svg
    class="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-text-mute"
    width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
  ><polyline points="6 9 12 15 18 9"/></svg>
</div>
