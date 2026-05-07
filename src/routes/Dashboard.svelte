<script lang="ts">
  import { navigate } from "../lib/router";

  type TileId = "media" | "zoom" | "attendance" | "settings";

  const tiles: { route: TileId; title: string; description: string; primary?: boolean }[] = [
    {
      route: "media",
      title: "Start Meeting",
      description: "Launch OBS, Meeting Media Manager and Zoom in sequence.",
      primary: true,
    },
    {
      route: "zoom",
      title: "Launch Zoom",
      description: "Open Zoom and join your configured meeting.",
    },
    {
      route: "attendance",
      title: "Calculate Attendance",
      description: "Total attendance from Zoom poll responses.",
    },
    {
      route: "settings",
      title: "Settings",
      description: "Meetings, paths, theme, updates.",
    },
  ];
</script>

<div class="mb-8">
  <h1 class="text-3xl font-semibold tracking-tight">Welcome back</h1>
  <p class="mt-1 text-sm text-text-mute">Pick a tool to get started.</p>
</div>

<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
  {#each tiles as tile}
    <button
      class="group flex flex-col items-start rounded-xl border border-border bg-surface p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-[var(--shadow-lg)]"
      class:border-brand={tile.primary}
      onclick={() => navigate(tile.route)}
    >
      <div
        class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg"
        style="background:{tile.primary ? 'var(--brand)' : 'var(--surface-2)'};color:{tile.primary ? '#fff' : 'var(--brand)'}"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          {#if tile.route === "media"}
            <polygon points="5 3 19 12 5 21 5 3"/>
          {:else if tile.route === "zoom"}
            <polygon points="23 7 16 12 23 17 23 7"/>
            <rect x="1" y="5" width="15" height="14" rx="2" ry="2"/>
          {:else if tile.route === "attendance"}
            <rect x="4" y="2" width="16" height="20" rx="2"/>
            <line x1="8" y1="6" x2="16" y2="6"/>
            <line x1="16" y1="14" x2="16" y2="18"/>
            <line x1="8" y1="10" x2="8.01" y2="10"/>
            <line x1="12" y1="10" x2="12.01" y2="10"/>
            <line x1="16" y1="10" x2="16.01" y2="10"/>
            <line x1="8" y1="14" x2="8.01" y2="14"/>
            <line x1="12" y1="14" x2="12.01" y2="14"/>
            <line x1="8" y1="18" x2="8.01" y2="18"/>
            <line x1="12" y1="18" x2="12.01" y2="18"/>
          {:else if tile.route === "settings"}
            <circle cx="12" cy="12" r="3"/>
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
          {/if}
        </svg>
      </div>
      <div class="text-base font-semibold">{tile.title}</div>
      <div class="mt-1 text-sm text-text-mute">{tile.description}</div>
    </button>
  {/each}
</div>
