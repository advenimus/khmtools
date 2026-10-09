<script lang="ts">
  import type { SaveStatus } from "../autosave.svelte";

  let { status, error }: { status: SaveStatus; error: string | null } = $props();
</script>

<div class="min-h-[1.25rem] text-xs" aria-live="polite">
  {#if status === "saving"}
    <span class="text-text-mute">Saving…</span>
  {:else if status === "saved"}
    <span class="text-success">Saved</span>
  {:else if status === "error"}
    <span class="text-danger">Not saved: {error}</span>
  {:else}
    <span class="text-text-mute">Changes save automatically.</span>
  {/if}
</div>
