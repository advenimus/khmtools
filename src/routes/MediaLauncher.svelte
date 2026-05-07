<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import { api, type MediaLauncherSettings } from "../lib/api";
  import { navigate } from "../lib/router";
  import { pushToast } from "../lib/stores/toasts";

  let settings: MediaLauncherSettings | null = $state(null);
  let showCustomMessage = $state(false);
  let running = $state(false);

  type Step = { id: string; label: string; status: "idle" | "running" | "done" | "skipped" | "error" };
  let steps: Step[] = $state([]);
  let popup = $state<{ open: boolean; title: string; body: string }>({ open: false, title: "", body: "" });

  onMount(reload);

  async function reload() {
    settings = await api.getMediaLauncherSettings();
    showCustomMessage = await api.shouldShowCustomMessage();
    rebuildSteps();
  }

  function rebuildSteps() {
    if (!settings) return;
    const out: Step[] = [];
    if (showCustomMessage) out.push({ id: "msg", label: settings.custom_message.title || "Custom message", status: "idle" });
    if (settings.toggles.launch_obs) out.push({ id: "obs", label: "Launch OBS Studio", status: "idle" });
    if (settings.toggles.launch_media_manager) out.push({ id: "mmm", label: "Launch Meeting Media Manager", status: "idle" });
    if (settings.toggles.launch_zoom) out.push({ id: "zoom", label: "Launch Zoom", status: "idle" });
    steps = out;
  }

  function setStatus(id: string, status: Step["status"]) {
    steps = steps.map((s) => (s.id === id ? { ...s, status } : s));
  }

  async function runSequence() {
    if (!settings) return;
    if (steps.length === 0) {
      pushToast("warning", "No tools enabled", "Turn on at least one tool in Settings.");
      return;
    }
    running = true;
    rebuildSteps();
    try {
      for (const step of steps) {
        setStatus(step.id, "running");
        if (step.id === "msg") {
          await showCustomMessageModal();
        } else if (step.id === "obs") {
          const r = await api.launchObs();
          if (!r.success) { setStatus(step.id, "error"); pushToast("warning", "OBS", r.message); }
          else { await sleep(2500); }
        } else if (step.id === "mmm") {
          const r = await api.launchMediaManager();
          if (!r.success) { setStatus(step.id, "error"); pushToast("warning", "Media Manager", r.message); }
          else { await sleep(2500); }
        } else if (step.id === "zoom") {
          const r = await api.launchZoom();
          if (!r.success) { setStatus(step.id, "error"); pushToast("warning", "Zoom", r.message); }
          else { await sleep(800); }
        }
        if (steps.find((s) => s.id === step.id)?.status === "running") {
          setStatus(step.id, "done");
        }
      }
      pushToast("success", "Meeting launched", "All steps completed.");
    } catch (e: any) {
      pushToast("danger", "Launch failed", String(e?.message ?? e));
    } finally {
      running = false;
    }
  }

  function showCustomMessageModal(): Promise<void> {
    return new Promise((resolve) => {
      if (!settings) return resolve();
      popup = { open: true, title: settings.custom_message.title, body: settings.custom_message.message };
      const ms = (settings.custom_message.display_time_seconds || 5) * 1000;
      setTimeout(() => { popup = { open: false, title: "", body: "" }; resolve(); }, ms);
    });
  }

  function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Start Meeting</h1>
  <p class="mt-1 text-sm text-text-mute">Launch your media tools in sequence.</p>
</div>

{#if !settings}
  <div class="text-text-mute">Loading…</div>
{:else}
  <Card>
    <ol class="space-y-3">
      {#each steps as step, idx}
        <li class="flex items-center gap-4">
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
            style:background={
              step.status === "done" ? "var(--success)" :
              step.status === "running" ? "var(--brand)" :
              step.status === "error" ? "var(--danger)" : "var(--surface-2)"
            }
            style:border-color={
              step.status === "idle" ? "var(--border)" : "transparent"
            }
            style:color={step.status === "idle" ? "var(--text-mute)" : "#fff"}
          >
            {#if step.status === "done"}
              ✓
            {:else if step.status === "running"}
              <svg class="animate-spin" width="14" height="14" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-opacity="0.25" stroke-width="4"/>
                <path d="M4 12a8 8 0 018-8" stroke="currentColor" stroke-width="4" stroke-linecap="round"/>
              </svg>
            {:else if step.status === "error"}
              !
            {:else}
              {idx + 1}
            {/if}
          </div>
          <span class="text-sm">{step.label}</span>
        </li>
      {/each}
      {#if steps.length === 0}
        <li class="text-sm text-text-mute">No tools enabled. <button class="underline" onclick={() => navigate("settings")}>Open settings</button>.</li>
      {/if}
    </ol>

    <div class="mt-6 flex items-center gap-3 border-t border-border pt-5">
      <Button size="lg" loading={running} disabled={steps.length === 0} onclick={runSequence}>
        {#snippet children()}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          Start Meeting
        {/snippet}
      </Button>
      <Button variant="ghost" onclick={() => navigate("settings")}>
        {#snippet children()}Configure tools →{/snippet}
      </Button>
    </div>
  </Card>
{/if}

<Modal open={popup.open} title={popup.title} size="md">
  {#snippet children()}
    <div class="whitespace-pre-line py-2 text-sm leading-relaxed">{popup.body}</div>
  {/snippet}
</Modal>
