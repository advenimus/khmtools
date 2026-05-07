<script lang="ts">
  import LogoMark from "./LogoMark.svelte";
  import ThemeToggle from "./ThemeToggle.svelte";
  import { navigate, route } from "../../lib/router";
</script>

<header
  class="flex h-14 items-center justify-between border-b border-border bg-surface px-5"
>
  <button
    class="flex items-center gap-2.5"
    onclick={() => navigate("dashboard")}
    aria-label="Home"
  >
    <LogoMark />
    <div class="flex flex-col items-start leading-tight">
      <span class="text-[15px] font-semibold tracking-tight">KHM Tools</span>
      <span class="text-[11px] text-text-mute">Kingdom Hall Media</span>
    </div>
  </button>

  <div class="flex items-center gap-2">
    <ThemeToggle />
    <button
      class="rounded-md p-2 text-text-mute hover:bg-surface-2 hover:text-text"
      class:bg-surface-2={$route === "settings"}
      class:text-text={$route === "settings"}
      aria-label="Settings"
      onclick={() => navigate("settings")}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
      </svg>
    </button>
  </div>
</header>
