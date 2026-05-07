<script lang="ts">
  import { onMount } from "svelte";
  import { route, navigate } from "./lib/router";
  import { api } from "./lib/api";
  import TopBar from "./lib/components/TopBar.svelte";
  import Sidebar from "./lib/components/Sidebar.svelte";
  import ToastHost from "./lib/components/ToastHost.svelte";
  import UpdateBanner from "./lib/components/UpdateBanner.svelte";
  import Dashboard from "./routes/Dashboard.svelte";
  import Attendance from "./routes/Attendance.svelte";
  import ZoomLauncher from "./routes/ZoomLauncher.svelte";
  import MediaLauncher from "./routes/MediaLauncher.svelte";
  import Settings from "./routes/Settings.svelte";
  import Onboarding from "./routes/Onboarding.svelte";

  let needsOnboarding = $state(false);
  let booted = $state(false);

  onMount(async () => {
    try {
      needsOnboarding = await api.onboardingNeeded();
      if (needsOnboarding) {
        navigate("onboarding");
      } else {
        const settings = await api.getAppSettings();
        if (settings.default_tool && settings.default_tool !== "dashboard") {
          navigate(settings.default_tool);
        }
      }
    } catch (e) {
      console.error("App init failed", e);
    } finally {
      booted = true;
    }
  });
</script>

{#if !booted}
  <div class="flex h-full items-center justify-center bg-bg text-text-mute">
    <div class="text-sm">Loading…</div>
  </div>
{:else if $route === "onboarding"}
  <Onboarding
    on:done={async () => {
      needsOnboarding = false;
      try {
        const settings = await api.getAppSettings();
        navigate(settings.default_tool ?? "dashboard");
      } catch {
        navigate("dashboard");
      }
    }}
  />
{:else}
  <div class="flex h-full flex-col bg-bg text-text">
    <TopBar />
    <UpdateBanner />
    <div class="flex flex-1 overflow-hidden">
      <Sidebar />
      <main class="flex-1 overflow-auto p-8">
        <div class="mx-auto max-w-5xl fade-in" data-route={$route}>
          {#if $route === "dashboard"}
            <Dashboard />
          {:else if $route === "attendance"}
            <Attendance />
          {:else if $route === "zoom"}
            <ZoomLauncher />
          {:else if $route === "media"}
            <MediaLauncher />
          {:else if $route === "settings"}
            <Settings />
          {/if}
        </div>
      </main>
    </div>
  </div>
{/if}

<ToastHost />
