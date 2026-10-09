<script lang="ts">
  import { onMount } from "svelte";
  import { route, navigate, type Route } from "./lib/router";
  import { api } from "./lib/api";
  import TopBar from "./lib/components/TopBar.svelte";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import ToastHost from "./lib/components/ToastHost.svelte";
  import UpdateBanner from "./lib/components/UpdateBanner.svelte";
  import Modal from "./lib/components/Modal.svelte";
  import Button from "./lib/components/Button.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import Attendance from "./routes/Attendance.svelte";
  import ZoomLauncher from "./routes/ZoomLauncher.svelte";
  import MediaLauncher from "./routes/MediaLauncher.svelte";
  import Settings from "./routes/Settings.svelte";
  import Onboarding from "./routes/Onboarding.svelte";
  import { popup, dismissPopup } from "./lib/stores/sequence";
  import { startUpdateChecks } from "./lib/stores/updates";

  let needsOnboarding = $state(false);
  let booted = $state(false);

  async function openDefaultTool() {
    try {
      const settings = await api.getAppSettings();
      navigate(settings.default_tool ?? "dashboard", { replace: true });
    } catch (e) {
      console.error("Couldn't read the default tool", e);
      navigate("dashboard", { replace: true });
    }
  }

  onMount(async () => {
    try {
      needsOnboarding = await api.onboardingNeeded();
      if (needsOnboarding) navigate("onboarding", { replace: true });
      else await openDefaultTool();
    } catch (e) {
      console.error("App init failed", e);
    } finally {
      booted = true;
    }
    startUpdateChecks();
  });

  $effect(() => {
    if (booted && !needsOnboarding && $route === "onboarding") {
      navigate("dashboard", { replace: true });
    }
  });

  async function onboardingDone() {
    needsOnboarding = false;
    await openDefaultTool();
  }

  const screens: Partial<Record<Route, any>> = {
    dashboard: Dashboard,
    attendance: Attendance,
    zoom: ZoomLauncher,
    media: MediaLauncher,
    settings: Settings,
  };
  const Screen = $derived(screens[$route]);
</script>

{#if !booted}
  <div class="flex h-full items-center justify-center bg-bg text-text-mute">
    <div class="text-sm">Loading…</div>
  </div>
{:else if needsOnboarding}
  <Onboarding ondone={onboardingDone} />
{:else}
  <div class="flex h-full flex-col bg-bg text-text">
    <TopBar />
    <UpdateBanner />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-auto p-8">
        {#key $route}
          <div class="mx-auto max-w-5xl fade-in" data-route={$route}>
            {#if Screen}<Screen />{/if}
          </div>
        {/key}
      </main>
    </div>
  </div>
{/if}

<Modal open={$popup.open} title={$popup.title} size="md" onclose={dismissPopup}>
  {#snippet children()}
    <div class="whitespace-pre-line py-2 text-sm leading-relaxed">{$popup.body}</div>
  {/snippet}
  {#snippet footer()}
    <span class="mr-auto self-center text-xs text-text-mute">Continuing in {$popup.secondsLeft}s</span>
    <Button onclick={dismissPopup}>{#snippet children()}Continue now{/snippet}</Button>
  {/snippet}
</Modal>

<ToastHost />
