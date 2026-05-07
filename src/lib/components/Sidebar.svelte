<script lang="ts">
  import { onMount } from "svelte";
  import { route, navigate, type Route } from "../router";
  import { api } from "../api";

  type Item = { id: Route; label: string; icon: string };

  const items: Item[] = [
    { id: "dashboard", label: "Dashboard", icon: "M3 12l2-2 4 4 8-8 4 4" },
    { id: "media", label: "Start Meeting", icon: "M5 3l14 9-14 9V3z" },
    { id: "zoom", label: "Launch Zoom", icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z" },
    { id: "attendance", label: "Attendance", icon: "M9 11H5a2 2 0 00-2 2v7h18v-7a2 2 0 00-2-2h-4M9 11V5a3 3 0 016 0v6M9 11h6" },
  ];

  let version = $state("…");
  onMount(async () => {
    try { version = await api.appVersion(); } catch (_) {}
  });
</script>

<aside class="hidden w-56 shrink-0 flex-col border-r border-border bg-surface md:flex">
  <nav class="flex-1 space-y-0.5 p-3">
    {#each items as item}
      <button
        class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-mute transition hover:bg-surface-2 hover:text-text"
        class:bg-surface-2={$route === item.id}
        class:text-text={$route === item.id}
        class:font-medium={$route === item.id}
        onclick={() => navigate(item.id)}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d={item.icon}/>
        </svg>
        {item.label}
      </button>
    {/each}

    <div class="my-3 border-t border-border"></div>

    <button
      class="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-text-mute transition hover:bg-surface-2 hover:text-text"
      class:bg-surface-2={$route === "settings"}
      class:text-text={$route === "settings"}
      onclick={() => navigate("settings")}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"/>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
      Settings
    </button>
  </nav>

  <div class="border-t border-border p-3 text-[11px] text-text-mute">
    v{version}
  </div>
</aside>
