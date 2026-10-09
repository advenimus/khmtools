<script lang="ts">
  interface Props {
    value: number;
    min: number;
    max: number;
    id?: string;
    class?: string;
    onchange?: (value: number) => void;
    "aria-label"?: string;
  }

  let {
    value = $bindable(),
    min,
    max,
    id,
    class: cls = "",
    onchange,
    "aria-label": ariaLabel,
  }: Props = $props();

  function clamp(raw: unknown): number {
    const n = Math.trunc(Number(raw));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  function commit(e: Event) {
    const input = e.currentTarget as HTMLInputElement;
    value = clamp(input.value);
    input.value = String(value);
    onchange?.(value);
  }
</script>

<input
  {id}
  type="number"
  inputmode="numeric"
  {min}
  {max}
  step="1"
  aria-label={ariaLabel}
  value={value}
  onchange={commit}
  onblur={commit}
  class="block h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 {cls}"
/>
