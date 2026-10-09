<script lang="ts">
  import { onMount } from "svelte";
  import { api, type SetupStatus } from "../api";
  import { navigate } from "../router";

  let status = $state<SetupStatus | null>(null);

  onMount(async () => {
    try {
      status = await api.setupStatus();
    } catch (e) {
      console.error("Couldn't check setup", e);
    }
  });

  const problems = $derived(status?.problems ?? []);
</script>

{#if problems.length > 0}
  <div class="mb-5 rounded-lg border border-warning/60 bg-warning/10 px-4 py-3 text-sm" role="status">
    <div class="font-medium">Setup isn't finished</div>
    <ul class="mt-1 list-disc pl-5 text-text-mute">
      {#each problems as p}<li class="break-words">{p}</li>{/each}
    </ul>
    <button class="mt-2 text-sm font-medium text-brand underline" onclick={() => navigate("settings")}>Fix in Settings</button>
  </div>
{/if}
