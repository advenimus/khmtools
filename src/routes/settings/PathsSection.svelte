<script lang="ts">
  import Card from "../../lib/components/Card.svelte";
  import Button from "../../lib/components/Button.svelte";
  import { api, errorMessage, type AppPaths, type AppKind } from "../../lib/api";
  import { pushToast } from "../../lib/stores/toasts";

  let { paths = $bindable() }: { paths: AppPaths } = $props();

  let busy = $state<AppKind | null>(null);

  const rows: { key: AppKind; label: string }[] = [
    { key: "zoom", label: "Zoom" },
    { key: "obs", label: "OBS Studio" },
    { key: "media_manager", label: "Meeting Media Manager" },
  ];

  async function browse(kind: AppKind) {
    busy = kind;
    try {
      const picked = await api.browseFor(kind);
      if (picked) {
        paths = { ...paths, [kind]: picked };
        pushToast("success", "Location saved");
      }
    } catch (e) {
      pushToast("danger", "Couldn't save that location", errorMessage(e));
    } finally {
      busy = null;
    }
  }

  async function clear(kind: AppKind) {
    const next = { ...paths, [kind]: null };
    busy = kind;
    try {
      await api.savePaths(next);
      paths = next;
    } catch (e) {
      pushToast("danger", "Couldn't reset that location", errorMessage(e));
    } finally {
      busy = null;
    }
  }
</script>

<Card>
  <div class="space-y-5">
    <p class="text-sm text-text-mute">
      KHM Tools looks for each program in its usual place. If it can't find one, pick it here.
    </p>

    {#each rows as p}
      <div>
        <div class="mb-2 text-sm font-medium">{p.label}</div>
        <div class="flex gap-2">
          <code class="flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 text-xs" title={paths[p.key] ?? ""}>
            {paths[p.key] ?? "Usual location"}
          </code>
          <Button variant="secondary" size="sm" loading={busy === p.key} onclick={() => browse(p.key)}>
            {#snippet children()}Browse…{/snippet}
          </Button>
          {#if paths[p.key]}
            <Button variant="ghost" size="sm" disabled={busy !== null} onclick={() => clear(p.key)}>
              {#snippet children()}Use usual location{/snippet}
            </Button>
          {/if}
        </div>
      </div>
    {/each}
  </div>
</Card>
