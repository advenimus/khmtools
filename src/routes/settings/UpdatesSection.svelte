<script lang="ts">
  import Card from "../../lib/components/Card.svelte";
  import Button from "../../lib/components/Button.svelte";
  import Modal from "../../lib/components/Modal.svelte";
  import Toggle from "../../lib/components/Toggle.svelte";
  import { api, errorMessage, type AppSettings, type UpdateChannel } from "../../lib/api";
  import { checkForUpdate } from "../../lib/stores/updates";
  import { pushToast } from "../../lib/stores/toasts";

  let { app = $bindable(), version }: { app: AppSettings; version: string } = $props();

  let confirmBeta = $state(false);
  let checking = $state(false);
  let savingChannel = $state(false);
  // Bumped to redraw the radios after a cancelled switch, since the saved
  // value didn't change but the clicked radio did.
  let radioKey = $state(0);

  async function applyChannel(c: UpdateChannel) {
    savingChannel = true;
    try {
      app = await api.setUpdateChannel(c);
      pushToast("success", c === "beta" ? "Switched to beta" : "Switched to stable", c === "beta"
        ? "You'll get test versions before everyone else."
        : "You'll get regular releases.");
    } catch (e) {
      pushToast("danger", "Couldn't change the update channel", errorMessage(e));
    } finally {
      savingChannel = false;
      radioKey++;
    }
  }

  function pickChannel(c: UpdateChannel) {
    if (c === app.update_channel) return;
    if (c === "beta") {
      confirmBeta = true;
      return;
    }
    applyChannel(c);
  }

  function cancelBeta() {
    confirmBeta = false;
    radioKey++;
  }

  async function confirmBetaSwitch() {
    confirmBeta = false;
    await applyChannel("beta");
  }

  async function setInstallOnQuit(on: boolean) {
    const next = { ...app, install_on_quit: on };
    try {
      await api.saveAppSettings(next);
      app = next;
    } catch (e) {
      app = { ...app };
      pushToast("danger", "Couldn't save that setting", errorMessage(e));
    }
  }

  async function checkNow() {
    checking = true;
    try {
      const r = await checkForUpdate();
      if (r.available) pushToast("info", `Version ${r.latest_version} is available`, "Use the blue bar at the top to install it.");
      else pushToast("success", "You're up to date", `Version ${r.current_version}`);
    } catch (e) {
      pushToast("warning", "Couldn't check for updates", errorMessage(e));
    } finally {
      checking = false;
    }
  }

  const channels: { v: UpdateChannel; l: string; d: string }[] = [
    { v: "stable", l: "Stable", d: "Tested releases. Recommended for meetings." },
    { v: "beta", l: "Beta", d: "Test versions. May have bugs." },
  ];
</script>

<Card>
  <div class="space-y-6">
    <div>
      <div class="mb-3 text-sm font-semibold">Current version</div>
      <div class="font-mono text-lg">v{version}</div>
    </div>

    <fieldset>
      <legend class="mb-3 text-sm font-semibold">Update channel</legend>
      {#key radioKey}
        <div class="space-y-2">
          {#each channels as ch}
            <label class="flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-surface-2 {app.update_channel === ch.v ? 'border-brand' : 'border-border'}">
              <input
                type="radio"
                name="channel"
                value={ch.v}
                checked={app.update_channel === ch.v}
                disabled={savingChannel}
                onchange={() => pickChannel(ch.v)}
              />
              <div>
                <div class="text-sm font-medium">{ch.l}</div>
                <div class="text-xs text-text-mute">{ch.d}</div>
              </div>
            </label>
          {/each}
        </div>
      {/key}
    </fieldset>

    <Toggle
      checked={app.install_on_quit}
      label="Install updates when I close KHM Tools"
      description="Downloads new versions in the background and installs them when you quit, so nothing changes during a meeting."
      onchange={setInstallOnQuit}
    />

    <div class="flex items-center gap-2 border-t border-border pt-5">
      <Button loading={checking} onclick={checkNow}>{#snippet children()}Check for updates now{/snippet}</Button>
    </div>
  </div>
</Card>

<Modal open={confirmBeta} title="Switch to test versions?" onclose={cancelBeta}>
  {#snippet children()}
    <p class="text-sm">Beta versions may have bugs and aren't recommended for live meetings. You can switch back to stable any time.</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="ghost" onclick={cancelBeta}>{#snippet children()}Cancel{/snippet}</Button>
    <Button onclick={confirmBetaSwitch}>{#snippet children()}Switch to beta{/snippet}</Button>
  {/snippet}
</Modal>
