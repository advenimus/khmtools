<script lang="ts">
  interface Props {
    value?: string;
    placeholder?: string;
    type?: "text" | "time" | "password";
    disabled?: boolean;
    id?: string;
    class?: string;
    invalid?: boolean;
    autocomplete?: HTMLInputElement["autocomplete"];
    onchange?: (e: Event) => void;
    oninput?: (e: Event) => void;
    "aria-label"?: string;
    "aria-describedby"?: string;
  }

  let {
    value = $bindable(""),
    placeholder = "",
    type = "text",
    disabled = false,
    id,
    class: cls = "",
    invalid = false,
    autocomplete = "off",
    onchange,
    oninput,
    "aria-label": ariaLabel,
    "aria-describedby": describedBy,
  }: Props = $props();
</script>

<input
  {id}
  {type}
  {placeholder}
  {disabled}
  {autocomplete}
  {onchange}
  {oninput}
  aria-label={ariaLabel}
  aria-describedby={describedBy}
  aria-invalid={invalid}
  bind:value
  class="block h-10 w-full rounded-md border bg-bg px-3 text-sm text-text placeholder:text-text-mute focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60 {invalid
    ? 'border-danger focus:border-danger focus:ring-danger/20'
    : 'border-border focus:border-brand focus:ring-brand/20'} {cls}"
/>
