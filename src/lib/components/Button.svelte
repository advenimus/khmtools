<script lang="ts">
  type Variant = "primary" | "secondary" | "ghost" | "danger";
  type Size = "sm" | "md" | "lg";

  interface Props {
    variant?: Variant;
    size?: Size;
    type?: "button" | "submit" | "reset";
    disabled?: boolean;
    loading?: boolean;
    fullWidth?: boolean;
    onclick?: (e: MouseEvent) => void;
    children?: any;
    class?: string;
  }

  let {
    variant = "primary",
    size = "md",
    type = "button",
    disabled = false,
    loading = false,
    fullWidth = false,
    onclick,
    children,
    class: cls = "",
  }: Props = $props();

  const variantCls: Record<Variant, string> = {
    primary:
      "bg-brand text-white hover:bg-brand-hover disabled:bg-brand/50",
    secondary:
      "bg-surface-2 text-text hover:bg-border disabled:text-text-mute border border-border",
    ghost: "text-text hover:bg-surface-2",
    danger: "bg-danger text-white hover:opacity-90",
  };

  const sizeCls: Record<Size, string> = {
    sm: "h-8 px-3 text-xs",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
  };
</script>

<button
  {type}
  {disabled}
  {onclick}
  class="inline-flex items-center justify-center gap-2 rounded-md font-medium transition disabled:cursor-not-allowed disabled:opacity-60 {variantCls[
    variant
  ]} {sizeCls[size]} {fullWidth ? 'w-full' : ''} {cls}"
>
  {#if loading}
    <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/>
      <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
    </svg>
  {/if}
  {@render children?.()}
</button>
