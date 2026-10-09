<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import { navigate } from "../lib/router";
  import { api, errorMessage, type MeetingInputCheck } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  let check = $state<MeetingInputCheck | null>(null);
  let loadError = $state<string | null>(null);
  let launching = $state(false);

  onMount(async () => {
    try {
      const m = await api.getMeetingSettings();
      check = await api.checkMeetingInput(m.meeting_id, m.passcode);
    } catch (e) {
      loadError = errorMessage(e);
    }
  });

  async function launch() {
    if (launching) return;
    launching = true;
    try {
      const r = await api.launchZoom();
      if (r.success) pushToast("success", "Zoom opened", r.message);
      else pushToast("danger", "Zoom didn't join", r.message);
    } catch (e) {
      pushToast("danger", "Zoom didn't open", errorMessage(e));
    } finally {
      launching = false;
    }
  }
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Launch Zoom</h1>
  <p class="mt-1 text-sm text-text-mute">Open Zoom and join your meeting in one click.</p>
</div>

<Card>
  <div class="flex flex-col items-start gap-5">
    <div class="w-full">
      <div class="text-xs uppercase tracking-wider text-text-mute">Meeting ID</div>
      <div class="mt-1 break-all font-mono text-2xl">
        {#if loadError}
          <span class="text-base text-danger">Couldn't read your meeting settings: {loadError}</span>
        {:else if check?.meeting_id}
          {check.meeting_id}
          {#if check.has_passcode}<span class="ml-2 align-middle text-xs text-text-mute">+ passcode</span>{/if}
        {:else}
          <span class="text-base text-text-mute">No meeting ID set. Zoom will open without joining.</span>
        {/if}
      </div>
    </div>

    <div class="w-full border-t border-border pt-5">
      <Button size="lg" loading={launching} onclick={launch}>
        {#snippet children()}
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Launch Zoom
        {/snippet}
      </Button>
      <Button class="ml-2" variant="ghost" onclick={() => navigate("settings")}>
        {#snippet children()}Change meeting ID →{/snippet}
      </Button>
    </div>

    <div class="text-xs text-text-mute">
      Sign in to Zoom first so it can join automatically. If you're the host, the meeting starts on its own.
    </div>
  </div>
</Card>
