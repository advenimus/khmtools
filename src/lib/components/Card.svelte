<script lang="ts">
  interface Props {
    class?: string;
    children?: any;
  }
  let { class: cls = "", children }: Props = $props();
</script>

<div class="rounded-xl border border-border bg-surface p-6 shadow-soft {cls}">
  {@render children?.()}
</div>
