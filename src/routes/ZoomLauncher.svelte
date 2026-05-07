<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import { navigate } from "../lib/router";
  import { api } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  let meetingId = $state("");
  let launching = $state(false);

  onMount(async () => {
    try {
      const m = await api.getMeetingSettings();
      meetingId = m.meeting_id ?? "";
    } catch (_) {}
  });

  async function launch() {
    launching = true;
    try {
      const r = await api.launchZoom();
      if (r.success) pushToast("success", "Zoom launched", r.message);
      else pushToast("warning", "Couldn't launch Zoom", r.message);
    } catch (e: any) {
      pushToast("danger", "Launch failed", String(e?.message ?? e));
    } finally {
      launching = false;
    }
  }
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Launch Zoom</h1>
  <p class="mt-1 text-sm text-text-mute">Open Zoom and join your configured meeting in one click.</p>
</div>

<Card>
  <div class="flex flex-col items-start gap-5">
    <div class="w-full">
      <div class="text-xs uppercase tracking-wider text-text-mute">Meeting ID</div>
      <div class="mt-1 font-mono text-2xl">
        {#if meetingId}{meetingId}{:else}<span class="text-text-mute text-base">No meeting ID configured</span>{/if}
      </div>
    </div>

    <div class="w-full border-t border-border pt-5">
      <Button size="lg" loading={launching} onclick={launch}>
        {#snippet children()}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Launch Zoom
        {/snippet}
      </Button>
      <Button class="ml-2" variant="ghost" onclick={() => navigate("settings")}>
        {#snippet children()}Edit meeting ID →{/snippet}
      </Button>
    </div>

    <div class="text-xs text-text-mute">
      You must be signed in to Zoom for the meeting to auto-join. If you're the host, the meeting will start automatically.
    </div>
  </div>
</Card>
