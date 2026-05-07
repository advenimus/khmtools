<script lang="ts">
  let { size = 28 }: { size?: number } = $props();
</script>

<div
  class="flex items-center justify-center rounded-md font-bold text-white"
  style="width:{size}px;height:{size}px;background:var(--brand);font-size:{Math.round(size * 0.42)}px;letter-spacing:-0.02em;"
>
  KHM
</div>
