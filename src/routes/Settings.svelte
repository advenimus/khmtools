<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import GeneralSection from "./settings/GeneralSection.svelte";
  import MeetingsSection from "./settings/MeetingsSection.svelte";
  import MediaSection from "./settings/MediaSection.svelte";
  import PathsSection from "./settings/PathsSection.svelte";
  import UpdatesSection from "./settings/UpdatesSection.svelte";
  import AboutSection from "./settings/AboutSection.svelte";
  import {
    api,
    errorMessage,
    type AppSettings,
    type MeetingSettings,
    type AppPaths,
    type MediaLauncherSettings,
  } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  type Section = "general" | "meetings" | "media" | "paths" | "updates" | "about";
  let section = $state<Section>("general");

  let app: AppSettings | null = $state(null);
  let meeting: MeetingSettings | null = $state(null);
  let paths: AppPaths | null = $state(null);
  let media: MediaLauncherSettings | null = $state(null);
  let version = $state("");
  let autoLaunchOn = $state(false);
  let loadError = $state<string | null>(null);

  let confirmReset = $state(false);
  let resetting = $state(false);

  async function load() {
    loadError = null;
    try {
      [app, meeting, paths, media, version] = await Promise.all([
        api.getAppSettings(),
        api.getMeetingSettings(),
        api.getPaths(),
        api.getMediaLauncherSettings(),
        api.appVersion(),
      ]);
    } catch (e) {
      loadError = errorMessage(e);
      return;
    }
    try {
      autoLaunchOn = await api.autoLaunchEnabled();
    } catch (e) {
      console.error("Couldn't read run-at-login state", e);
    }
  }

  onMount(load);

  async function doReset() {
    resetting = true;
    try {
      await api.resetAllSettings();
      try {
        localStorage.removeItem("khm-theme");
      } catch {
        // Cached theme is only a startup hint.
      }
      window.location.reload();
    } catch (e) {
      pushToast("danger", "Reset didn't finish", errorMessage(e));
      resetting = false;
      confirmReset = false;
    }
  }

  const tabs: { id: Section; label: string }[] = [
    { id: "general", label: "General" },
    { id: "meetings", label: "Meetings" },
    { id: "media", label: "Start Meeting" },
    { id: "paths", label: "Program Locations" },
    { id: "updates", label: "Updates" },
    { id: "about", label: "About" },
  ];
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
</div>

{#if loadError}
  <Card>
    <p class="text-sm">Couldn't load your settings: {loadError}</p>
    <div class="mt-4"><Button onclick={load}>{#snippet children()}Try again{/snippet}</Button></div>
  </Card>
{:else}
  <div class="grid grid-cols-12 gap-6">
    <nav class="col-span-12 md:col-span-3" aria-label="Settings sections">
      <ul class="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0.5">
        {#each tabs as tab}
          <li>
            <button
              class="block w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition {section === tab.id
                ? 'bg-surface-2 font-medium text-text'
                : 'text-text-mute hover:bg-surface-2'}"
              aria-current={section === tab.id ? "page" : undefined}
              onclick={() => (section = tab.id)}
            >
              {tab.label}
            </button>
          </li>
        {/each}
      </ul>
    </nav>

    <div class="col-span-12 md:col-span-9">
      {#if section === "general" && app}
        <GeneralSection bind:app bind:autoLaunchOn onreset={() => (confirmReset = true)} />
      {:else if section === "meetings" && meeting}
        <MeetingsSection bind:meeting />
      {:else if section === "media" && media}
        <MediaSection bind:media />
      {:else if section === "paths" && paths}
        <PathsSection bind:paths />
      {:else if section === "updates" && app}
        <UpdatesSection bind:app {version} />
      {:else if section === "about"}
        <AboutSection {version} />
      {:else}
        <div class="text-text-mute">Loading…</div>
      {/if}
    </div>
  </div>
{/if}

<Modal open={confirmReset} title="Reset all settings?" onclose={() => (confirmReset = false)}>
  {#snippet children()}
    <p class="text-sm">This erases your meeting ID, program locations, reminder and theme, turns off Run at login, and starts setup again right away.</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (confirmReset = false)}>{#snippet children()}Cancel{/snippet}</Button>
    <Button variant="danger" loading={resetting} onclick={doReset}>{#snippet children()}Reset everything{/snippet}</Button>
  {/snippet}
</Modal>
