<script lang="ts">
  import Modal from "./Modal.svelte";
  import Button from "./Button.svelte";
  import { api, errorMessage } from "../api";
  import { availableUpdate, bannerDismissed } from "../stores/updates";
  import { running as meetingStarting } from "../stores/sequence";
  import { pushToast } from "../stores/toasts";

  let installing = $state(false);
  let confirming = $state(false);

  async function install() {
    confirming = false;
    installing = true;
    try {
      await api.installUpdate();
    } catch (e) {
      pushToast("danger", "Update failed", errorMessage(e));
    } finally {
      installing = false;
    }
  }
</script>

{#if $availableUpdate && !$bannerDismissed}
  <div class="flex items-center gap-3 border-b border-border bg-brand/10 px-5 py-2.5 text-xs" role="status">
    <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 12a9 9 0 11-6.5-8.7"/><polyline points="21 4 21 12 13 12"/>
    </svg>
    <span class="text-text">
      Update available: <span class="font-semibold">v{$availableUpdate.latest_version}</span>
    </span>
    <Button size="sm" class="ml-auto" loading={installing} disabled={$meetingStarting} onclick={() => (confirming = true)}>
      {#snippet children()}{installing ? "Installing…" : "Install & restart"}{/snippet}
    </Button>
    <Button size="sm" variant="ghost" disabled={installing} onclick={() => bannerDismissed.set(true)}>
      {#snippet children()}Later{/snippet}
    </Button>
  </div>
{/if}

<Modal open={confirming} title="Install update now?" onclose={() => (confirming = false)}>
  {#snippet children()}
    <p class="text-sm">KHM Tools will close and restart. Don't do this during a meeting. Zoom, OBS and Media Manager keep running.</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (confirming = false)}>{#snippet children()}Not now{/snippet}</Button>
    <Button onclick={install}>{#snippet children()}Install & restart{/snippet}</Button>
  {/snippet}
</Modal>
