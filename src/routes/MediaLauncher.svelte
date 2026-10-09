<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import SetupWarning from "../lib/components/SetupWarning.svelte";
  import { errorMessage } from "../lib/api";
  import { navigate } from "../lib/router";
  import { steps, running, refreshPlan, runSequence, type StepStatus } from "../lib/stores/sequence";

  let loadError = $state<string | null>(null);
  let loaded = $state(false);

  async function load() {
    loadError = null;
    try {
      await refreshPlan();
      loaded = true;
    } catch (e) {
      loadError = errorMessage(e);
    }
  }

  onMount(load);

  const circleBg: Record<StepStatus, string> = {
    done: "var(--success)",
    running: "var(--brand-solid)",
    error: "var(--danger-solid)",
    skipped: "var(--surface-2)",
    idle: "var(--surface-2)",
  };
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Start Meeting</h1>
  <p class="mt-1 text-sm text-text-mute">Opens your meeting programs one after another.</p>
</div>

<SetupWarning />

{#if loadError}
  <Card>
    <p class="text-sm">Couldn't load your Start Meeting settings: {loadError}</p>
    <div class="mt-4"><Button onclick={load}>{#snippet children()}Try again{/snippet}</Button></div>
  </Card>
{:else if !loaded}
  <div class="text-text-mute">Loading…</div>
{:else}
  <Card>
    <ol class="space-y-3">
      {#each $steps as step, idx}
        <li class="flex items-start gap-4">
          <div
            class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
            style:background={circleBg[step.status]}
            style:border-color={step.status === "idle" || step.status === "skipped" ? "var(--border)" : "transparent"}
            style:color={step.status === "idle" || step.status === "skipped" ? "var(--text-mute)" : "#fff"}
            aria-hidden="true"
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
          <div class="min-w-0 pt-1">
            <div class="text-sm">
              {step.label}
              <span class="sr-only">({step.status})</span>
              {#if step.status === "skipped"}<span class="text-xs text-text-mute"> (skipped)</span>{/if}
            </div>
            {#if step.status === "error" && step.message}
              <div class="mt-1 break-words text-xs text-danger">{step.message}</div>
            {/if}
          </div>
        </li>
      {/each}
      {#if $steps.length === 0}
        <li class="text-sm text-text-mute">No programs are turned on. <button class="underline" onclick={() => navigate("settings")}>Open settings</button>.</li>
      {/if}
    </ol>

    <div class="mt-6 flex items-center gap-3 border-t border-border pt-5">
      <Button size="lg" loading={$running} disabled={$steps.length === 0} onclick={runSequence}>
        {#snippet children()}
          <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
          {$running ? "Starting…" : "Start Meeting"}
        {/snippet}
      </Button>
      <Button variant="ghost" onclick={() => navigate("settings")}>
        {#snippet children()}Choose programs →{/snippet}
      </Button>
    </div>
  </Card>
{/if}
