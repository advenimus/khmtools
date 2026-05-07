<script lang="ts">
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import { api } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  let counts = $state<number[]>(Array(11).fill(0));
  let total = $state<number | null>(null);
  let calculating = $state(false);

  async function calculate() {
    calculating = true;
    try {
      total = await api.calculateAttendance(counts);
    } catch (e: any) {
      pushToast("danger", "Calculation failed", String(e?.message ?? e));
    } finally {
      calculating = false;
    }
  }

  function reset() {
    counts = Array(11).fill(0);
    total = null;
  }
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Attendance Calculator</h1>
  <p class="mt-1 text-sm text-text-mute">
    Enter the number of poll responses for each option. Each option's count is multiplied by the number of people watching together.
  </p>
</div>

{#if total === null}
  <Card>
    <form
      onsubmit={(e) => { e.preventDefault(); calculate(); }}
      class="space-y-5"
    >
      <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {#each Array(10) as _, i}
          <label class="block">
            <span class="mb-1 block text-xs text-text-mute">{i + 1} {i === 0 ? "person" : "people"}</span>
            <input
              type="number"
              min="0"
              bind:value={counts[i]}
              class="block h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
            />
          </label>
        {/each}
        <label class="block">
          <span class="mb-1 block text-xs text-text-mute">Phone connections</span>
          <input
            type="number"
            min="0"
            bind:value={counts[10]}
            class="block h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
          />
        </label>
      </div>

      <div class="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" loading={calculating}>
          {#snippet children()}Calculate Total{/snippet}
        </Button>
        <Button type="button" variant="ghost" onclick={reset}>
          {#snippet children()}Reset{/snippet}
        </Button>
        <span class="ml-auto text-xs text-text-mute">Press Enter to calculate</span>
      </div>
    </form>
  </Card>
{:else}
  <Card>
    <div class="flex flex-col items-center py-8 text-center">
      <div class="text-xs uppercase tracking-wider text-text-mute">Total attendance</div>
      <div class="mt-2 text-7xl font-bold text-brand">{total}</div>
      <div class="mt-6 flex gap-3">
        <Button onclick={() => (total = null)} variant="secondary">
          {#snippet children()}Edit values{/snippet}
        </Button>
        <Button onclick={reset}>
          {#snippet children()}Calculate again{/snippet}
        </Button>
      </div>
    </div>
  </Card>
{/if}
