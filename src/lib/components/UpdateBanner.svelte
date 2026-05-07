<script lang="ts">
  import { onMount } from "svelte";
  import { api, type UpdateInfo } from "../api";
  import { pushToast } from "../stores/toasts";

  let info: UpdateInfo | null = $state(null);
  let installing = $state(false);

  onMount(async () => {
    try {
      const result = await api.checkForUpdate();
      if (result.available) info = result;
    } catch (_) {}
  });

  async function install() {
    installing = true;
    try {
      await api.installUpdate();
    } catch (e: any) {
      pushToast("danger", "Update failed", String(e?.message ?? e));
      installing = false;
    }
  }
</script>

{#if info?.available}
  <div class="flex items-center gap-3 border-b border-border bg-brand/10 px-5 py-2.5 text-xs">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 11-6.5-8.7"/><polyline points="21 4 21 12 13 12"/>
    </svg>
    <span class="text-text">
      Update available: <span class="font-semibold">v{info.latest_version}</span>
    </span>
    <button class="ml-auto rounded-md bg-brand px-3 py-1 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-50" disabled={installing} onclick={install}>
      {installing ? "Installing…" : "Install & restart"}
    </button>
    <button class="rounded-md px-2 py-1 text-text-mute hover:bg-surface-2 hover:text-text" onclick={() => (info = null)}>
      Later
    </button>
  </div>
{/if}
