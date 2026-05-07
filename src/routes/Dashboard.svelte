<script lang="ts">
  import { navigate } from "../lib/router";

  const tiles = [
    {
      route: "media" as const,
      title: "Start Meeting",
      description: "Launch OBS, Meeting Media Manager and Zoom in sequence.",
      icon: "M5 3l14 9-14 9V3z",
      primary: true,
    },
    {
      route: "zoom" as const,
      title: "Launch Zoom",
      description: "Open Zoom and join your configured meeting.",
      icon: "M23 7l-7 5 7 5V7zM1 5h15v14H1z",
    },
    {
      route: "attendance" as const,
      title: "Calculate Attendance",
      description: "Total attendance from Zoom poll responses.",
      icon: "M9 11H5a2 2 0 00-2 2v7h18v-7a2 2 0 00-2-2h-4M9 11V5a3 3 0 016 0v6M9 11h6",
    },
    {
      route: "settings" as const,
      title: "Settings",
      description: "Meetings, paths, theme, updates.",
      icon: "M12 8v8M8 12h8",
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
        class="mb-4 flex h-10 w-10 items-center justify-center rounded-lg text-white"
        style="background:{tile.primary ? 'var(--brand)' : 'var(--surface-2)'};color:{tile.primary ? '#fff' : 'var(--brand)'}"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d={tile.icon}/>
        </svg>
      </div>
      <div class="text-base font-semibold">{tile.title}</div>
      <div class="mt-1 text-sm text-text-mute">{tile.description}</div>
    </button>
  {/each}
</div>
