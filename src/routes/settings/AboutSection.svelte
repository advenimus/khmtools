<script lang="ts">
  import Card from "../../lib/components/Card.svelte";
  import Button from "../../lib/components/Button.svelte";
  import { api, errorMessage } from "../../lib/api";
  import { pushToast } from "../../lib/stores/toasts";

  let { version }: { version: string } = $props();

  const REPO_URL = "https://github.com/advenimus/khmtools";

  async function attempt(action: () => Promise<void>, failure: string) {
    try {
      await action();
    } catch (e) {
      pushToast("danger", failure, errorMessage(e));
    }
  }
</script>

<Card>
  <div class="space-y-3">
    <div class="text-base font-semibold">KHM Tools</div>
    <div class="text-sm text-text-mute">Tools for hybrid Kingdom Hall meetings.</div>
    <div class="text-sm">Version <span class="font-mono">v{version}</span></div>
    <div class="flex gap-2 pt-3">
      <Button variant="secondary" size="sm" onclick={() => attempt(api.openLogsDir, "Couldn't open the logs folder")}>
        {#snippet children()}Open logs folder{/snippet}
      </Button>
      <Button variant="ghost" size="sm" onclick={() => attempt(() => api.openUrl(REPO_URL), "Couldn't open GitHub")}>
        {#snippet children()}GitHub page{/snippet}
      </Button>
    </div>
  </div>
</Card>
