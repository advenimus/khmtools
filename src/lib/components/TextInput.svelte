<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    type?: "text" | "number" | "time";
    min?: number | string;
    max?: number | string;
    disabled?: boolean;
    id?: string;
    class?: string;
    onchange?: (e: Event) => void;
    oninput?: (e: Event) => void;
  }

  let {
    value = $bindable(""),
    placeholder = "",
    type = "text",
    min,
    max,
    disabled = false,
    id,
    class: cls = "",
    onchange,
    oninput,
  }: Props = $props();
</script>

<input
  {id}
  {type}
  {min}
  {max}
  {placeholder}
  {disabled}
  {onchange}
  {oninput}
  bind:value
  class="block h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text placeholder:text-text-mute focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:cursor-not-allowed disabled:opacity-60 {cls}"
/>
