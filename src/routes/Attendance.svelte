<script lang="ts">
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import { api, errorMessage } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  const OPTION_COUNT = 11;
  const PHONE_INDEX = 10;
  const MAX_PER_OPTION = 10000;

  let counts = $state<(number | null)[]>(Array(OPTION_COUNT).fill(0));
  let total = $state<number | null>(null);
  let calculating = $state(false);

  function cleaned(): number[] {
    return counts.map((c) => {
      const n = Math.trunc(Number(c));
      return Number.isFinite(n) && n > 0 ? n : 0;
    });
  }

  const breakdown = $derived(
    cleaned()
      .map((c, i) => (c === 0 ? null : i === PHONE_INDEX ? `${c} phone` : `${c}×${i + 1}`))
      .filter(Boolean)
      .join(" + ")
  );

  async function calculate() {
    if (calculating) return;
    const values = cleaned();
    if (values.some((v) => v > MAX_PER_OPTION)) {
      pushToast("warning", "That number looks too big", `Each box can be at most ${MAX_PER_OPTION}. Check for a typo.`);
      return;
    }
    counts = values;
    calculating = true;
    try {
      total = await api.calculateAttendance(values);
    } catch (e) {
      pushToast("danger", "Couldn't calculate", errorMessage(e));
    } finally {
      calculating = false;
    }
  }

  function startOver() {
    counts = Array(OPTION_COUNT).fill(0);
    total = null;
  }

  async function copyTotal() {
    try {
      await navigator.clipboard.writeText(String(total));
      pushToast("success", "Copied", `${total} is on the clipboard.`);
    } catch (e) {
      pushToast("danger", "Couldn't copy", errorMessage(e));
    }
  }

  const inputCls =
    "block h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20";
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Attendance Calculator</h1>
  <p class="mt-1 text-sm text-text-mute">
    Type how many people picked each Zoom poll answer. Each answer is multiplied by the number of people watching together. Empty boxes count as 0.
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
            <input type="number" min="0" max={MAX_PER_OPTION} step="1" inputmode="numeric" bind:value={counts[i]} class={inputCls} />
          </label>
        {/each}
        <label class="block">
          <span class="mb-1 block text-xs text-text-mute">Phone callers (1 person each)</span>
          <input type="number" min="0" max={MAX_PER_OPTION} step="1" inputmode="numeric" bind:value={counts[PHONE_INDEX]} class={inputCls} />
        </label>
      </div>

      <div class="flex items-center gap-3 border-t border-border pt-5">
        <Button type="submit" loading={calculating}>
          {#snippet children()}Calculate Total{/snippet}
        </Button>
        <Button type="button" variant="ghost" onclick={startOver}>
          {#snippet children()}Clear all{/snippet}
        </Button>
        <span class="ml-auto text-xs text-text-mute">Press Enter to calculate</span>
      </div>
    </form>
  </Card>
{:else}
  <Card>
    <div class="flex flex-col items-center py-8 text-center">
      <div class="text-xs uppercase tracking-wider text-text-mute">Total attendance</div>
      <div class="mt-2 text-7xl font-bold text-brand" aria-live="polite">{total}</div>
      <div class="mt-3 max-w-full break-words text-xs text-text-mute">
        {breakdown ? `${breakdown} = ${total}` : "Every box was 0. Check that you typed the poll results."}
      </div>
      <div class="mt-6 flex flex-wrap justify-center gap-3">
        <Button onclick={copyTotal}>
          {#snippet children()}Copy total{/snippet}
        </Button>
        <Button onclick={() => (total = null)} variant="secondary">
          {#snippet children()}Edit numbers{/snippet}
        </Button>
        <Button onclick={startOver} variant="ghost">
          {#snippet children()}Start over{/snippet}
        </Button>
      </div>
    </div>
  </Card>
{/if}
