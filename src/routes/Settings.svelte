<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../lib/components/Card.svelte";
  import Button from "../lib/components/Button.svelte";
  import TextInput from "../lib/components/TextInput.svelte";
  import Select from "../lib/components/Select.svelte";
  import Toggle from "../lib/components/Toggle.svelte";
  import Modal from "../lib/components/Modal.svelte";
  import {
    api,
    type AppSettings,
    type MeetingSettings,
    type AppPaths,
    type MediaLauncherSettings,
    type ThemeMode,
    type UpdateChannel,
  } from "../lib/api";
  import { setTheme, theme as themeStore } from "../lib/stores/theme";
  import { pushToast } from "../lib/stores/toasts";

  type Section = "general" | "meetings" | "media" | "paths" | "updates" | "about";
  let section = $state<Section>("general");

  let app: AppSettings | null = $state(null);
  let meeting: MeetingSettings | null = $state(null);
  let paths: AppPaths | null = $state(null);
  let media: MediaLauncherSettings | null = $state(null);
  let version = $state("");
  let autoLaunchOn = $state(false);

  let confirmReset = $state(false);
  let confirmBeta = $state(false);
  let pendingChannel: UpdateChannel | null = $state(null);

  onMount(async () => {
    [app, meeting, paths, media, version, autoLaunchOn] = await Promise.all([
      api.getAppSettings(),
      api.getMeetingSettings(),
      api.getPaths(),
      api.getMediaLauncherSettings(),
      api.appVersion(),
      api.autoLaunchEnabled(),
    ]);
  });

  async function saveApp() {
    if (!app) return;
    await api.saveAppSettings(app);
    pushToast("success", "Settings saved");
  }
  async function saveMeeting() {
    if (!meeting) return;
    await api.saveMeetingSettings(meeting);
    pushToast("success", "Meeting settings saved");
  }
  async function savePaths() {
    if (!paths) return;
    await api.savePaths(paths);
    pushToast("success", "Paths saved");
  }
  async function saveMedia() {
    if (!media) return;
    await api.saveMediaLauncherSettings(media);
    pushToast("success", "Media Launcher settings saved");
  }

  async function browse(kind: "zoom" | "obs" | "media_manager") {
    if (!paths) return;
    const p = await api.browseFor(kind);
    if (p) {
      paths = { ...paths, [kind]: p };
      await savePaths();
    }
  }

  async function pickChannel(c: UpdateChannel) {
    if (!app) return;
    if (c === "beta" && app.update_channel !== "beta") {
      pendingChannel = "beta";
      confirmBeta = true;
      return;
    }
    app = { ...app, update_channel: c };
    await api.setUpdateChannel(c);
    pushToast("success", "Update channel changed", `Now using ${c} channel.`);
  }

  async function confirmBetaSwitch() {
    if (!app || pendingChannel === null) return;
    app = { ...app, update_channel: pendingChannel };
    await api.setUpdateChannel(pendingChannel);
    confirmBeta = false;
    pendingChannel = null;
    pushToast("success", "Switched to beta channel", "You'll receive pre-release updates.");
  }

  async function checkUpdate() {
    try {
      const r = await api.checkForUpdate();
      if (r.available)
        pushToast("info", `v${r.latest_version} available`, "Use the banner at the top to install.");
      else pushToast("success", "You're up to date", `v${r.current_version}`);
    } catch (e: any) {
      pushToast("danger", "Update check failed", String(e?.message ?? e));
    }
  }

  async function doReset() {
    await api.resetAllSettings();
    pushToast("success", "Settings reset", "Restart the app to complete.");
    confirmReset = false;
  }

  async function setRunAtLogon(enabled: boolean) {
    autoLaunchOn = enabled;
    if (app) {
      app = { ...app, run_at_logon: enabled };
      await saveApp();
    }
    await api.autoLaunchSet(enabled);
  }

  function onThemeChange(t: ThemeMode) {
    setTheme(t);
    if (app) app = { ...app, theme: t };
  }

  const tabs: { id: Section; label: string }[] = [
    { id: "general", label: "General" },
    { id: "meetings", label: "Meetings" },
    { id: "media", label: "Media Launcher" },
    { id: "paths", label: "Application Paths" },
    { id: "updates", label: "Updates" },
    { id: "about", label: "About" },
  ];

  const dayMid = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
  ];
  const dayWeekend = [
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
  ];
</script>

<div class="mb-6">
  <h1 class="text-2xl font-semibold tracking-tight">Settings</h1>
</div>

<div class="grid grid-cols-12 gap-6">
  <nav class="col-span-12 md:col-span-3">
    <ul class="flex flex-row gap-1 overflow-x-auto md:flex-col md:gap-0.5">
      {#each tabs as tab}
        <li>
          <button
            class="block w-full whitespace-nowrap rounded-md px-3 py-2 text-left text-sm transition"
            class:bg-surface-2={section === tab.id}
            class:text-text={section === tab.id}
            class:font-medium={section === tab.id}
            class:text-text-mute={section !== tab.id}
            onclick={() => (section = tab.id)}
          >
            {tab.label}
          </button>
        </li>
      {/each}
    </ul>
  </nav>

  <div class="col-span-12 md:col-span-9">
    {#if section === "general" && app}
      <Card>
        <div class="space-y-6">
          <div>
            <div class="mb-3 text-sm font-semibold">Theme</div>
            <div class="flex gap-2">
              {#each [{ v: "system", l: "System" }, { v: "light", l: "Light" }, { v: "dark", l: "Dark" }] as opt}
                <button
                  class="rounded-md border px-3 py-1.5 text-xs transition"
                  class:border-brand={$themeStore === opt.v}
                  class:bg-brand={$themeStore === opt.v}
                  class:text-white={$themeStore === opt.v}
                  class:border-border={$themeStore !== opt.v}
                  onclick={() => onThemeChange(opt.v as ThemeMode)}
                >
                  {opt.l}
                </button>
              {/each}
            </div>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Window</div>
            <div class="space-y-3">
              <Toggle
                bind:checked={app.always_maximize}
                label="Always open maximized"
                description="The window will fill the screen on launch."
                onchange={saveApp}
              />
              <Toggle
                checked={autoLaunchOn}
                label="Run at login"
                description="Start KHM Tools automatically when you sign in."
                onchange={setRunAtLogon}
              />
            </div>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Default tool on launch</div>
            <Select
              bind:value={app.default_tool}
              options={[
                { value: "dashboard", label: "Dashboard" },
                { value: "media", label: "Start Meeting" },
                { value: "zoom", label: "Launch Zoom" },
                { value: "attendance", label: "Attendance Calculator" },
              ]}
            />
          </div>

          <div class="flex items-center gap-2 border-t border-border pt-5">
            <Button onclick={saveApp}>{#snippet children()}Save{/snippet}</Button>
            <Button variant="danger" onclick={() => (confirmReset = true)}>
              {#snippet children()}Reset all settings{/snippet}
            </Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if section === "meetings" && meeting}
      <Card>
        <div class="space-y-6">
          <div>
            <div class="mb-3 text-sm font-semibold">Meeting credentials</div>
            <label class="block">
              <span class="mb-1 block text-xs text-text-mute">Recurring Zoom meeting ID</span>
              <TextInput bind:value={meeting.meeting_id} placeholder="e.g. 123 4567 8901" />
            </label>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Midweek meeting</div>
            <div class="grid grid-cols-2 gap-3">
              <Select bind:value={meeting.midweek.day} options={dayMid} />
              <TextInput bind:value={meeting.midweek.time} type="time" />
            </div>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Weekend meeting</div>
            <div class="grid grid-cols-2 gap-3">
              <Select bind:value={meeting.weekend.day} options={dayWeekend} />
              <TextInput bind:value={meeting.weekend.time} type="time" />
            </div>
          </div>

          <div class="border-t border-border pt-5">
            <Button onclick={saveMeeting}>{#snippet children()}Save{/snippet}</Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if section === "media" && media}
      <Card>
        <div class="space-y-6">
          <div>
            <div class="mb-3 text-sm font-semibold">Tools to launch</div>
            <div class="space-y-3">
              <Toggle bind:checked={media.toggles.launch_obs} label="Launch OBS Studio" description="Starts with virtual camera." />
              <Toggle bind:checked={media.toggles.launch_media_manager} label="Launch Meeting Media Manager" />
              <Toggle bind:checked={media.toggles.launch_zoom} label="Launch Zoom" description="Joins your configured meeting." />
            </div>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Custom message popup</div>
            <div class="space-y-3">
              <Select
                bind:value={media.custom_message.display_when}
                options={[
                  { value: "none", label: "Never" },
                  { value: "always", label: "Always" },
                  { value: "weekend", label: "Weekend meetings only" },
                ]}
              />
              <label class="block">
                <span class="mb-1 block text-xs text-text-mute">Title</span>
                <TextInput bind:value={media.custom_message.title} />
              </label>
              <label class="block">
                <span class="mb-1 block text-xs text-text-mute">Message</span>
                <textarea
                  bind:value={media.custom_message.message}
                  rows="4"
                  class="block w-full resize-y rounded-md border border-border bg-bg p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                ></textarea>
              </label>
              <label class="block">
                <span class="mb-1 block text-xs text-text-mute">Display time (seconds)</span>
                <TextInput bind:value={media.custom_message.display_time_seconds as any} type="number" min="1" max="60" />
              </label>
            </div>
          </div>

          <div class="border-t border-border pt-5">
            <Button onclick={saveMedia}>{#snippet children()}Save{/snippet}</Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if section === "paths" && paths}
      <Card>
        <div class="space-y-5">
          <p class="text-sm text-text-mute">Override the default location of each application. Leave blank to use the platform default.</p>

          {#each [{ key: "zoom", label: "Zoom" }, { key: "obs", label: "OBS Studio" }, { key: "media_manager", label: "Meeting Media Manager" }] as p}
            <div>
              <div class="mb-2 text-sm font-medium">{p.label}</div>
              <div class="flex gap-2">
                <code class="flex-1 truncate rounded-md border border-border bg-bg px-3 py-2 text-xs">
                  {(paths as any)[p.key] ?? "Using default"}
                </code>
                <Button variant="secondary" size="sm" onclick={() => browse(p.key as any)}>
                  {#snippet children()}Browse…{/snippet}
                </Button>
                {#if (paths as any)[p.key]}
                  <Button variant="ghost" size="sm" onclick={() => { paths = { ...paths!, [p.key]: null }; savePaths(); }}>
                    {#snippet children()}Clear{/snippet}
                  </Button>
                {/if}
              </div>
            </div>
          {/each}
        </div>
      </Card>
    {/if}

    {#if section === "updates" && app}
      <Card>
        <div class="space-y-6">
          <div>
            <div class="mb-3 text-sm font-semibold">Current version</div>
            <div class="font-mono text-lg">v{version}</div>
          </div>

          <div>
            <div class="mb-3 text-sm font-semibold">Update channel</div>
            <div class="space-y-2">
              <label class="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
                class:border-brand={app.update_channel === "stable"}>
                <input type="radio" name="channel" checked={app.update_channel === "stable"} onchange={() => pickChannel("stable")} />
                <div>
                  <div class="text-sm font-medium">Stable</div>
                  <div class="text-xs text-text-mute">Production releases. Recommended.</div>
                </div>
              </label>
              <label class="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
                class:border-brand={app.update_channel === "beta"}>
                <input type="radio" name="channel" checked={app.update_channel === "beta"} onchange={() => pickChannel("beta")} />
                <div>
                  <div class="text-sm font-medium">Beta</div>
                  <div class="text-xs text-text-mute">Pre-release builds. May contain bugs.</div>
                </div>
              </label>
            </div>
          </div>

          <div>
            <Toggle
              bind:checked={app.install_on_quit}
              label="Install updates on quit"
              description="Apply downloaded updates the next time you close the app."
              onchange={saveApp}
            />
          </div>

          <div class="flex items-center gap-2 border-t border-border pt-5">
            <Button onclick={checkUpdate}>{#snippet children()}Check for updates now{/snippet}</Button>
          </div>
        </div>
      </Card>
    {/if}

    {#if section === "about"}
      <Card>
        <div class="space-y-3">
          <div class="text-base font-semibold">KHM Tools</div>
          <div class="text-sm text-text-mute">Cross-platform Kingdom Hall Media tools.</div>
          <div class="text-sm">Version <span class="font-mono">v{version}</span></div>
          <div class="pt-3">
            <Button variant="secondary" size="sm" onclick={() => api.openLogsDir()}>
              {#snippet children()}Open logs folder{/snippet}
            </Button>
          </div>
          <div class="pt-3 text-xs text-text-mute">
            <button class="underline" onclick={() => api.openUrl("https://github.com/advenimus/khmtools")}>GitHub</button>
          </div>
        </div>
      </Card>
    {/if}
  </div>
</div>

<Modal open={confirmReset} title="Reset all settings?" onclose={() => (confirmReset = false)}>
  {#snippet children()}
    <p class="text-sm">This clears every preference (meetings, paths, theme) and starts onboarding again on next launch. Are you sure?</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => (confirmReset = false)}>{#snippet children()}Cancel{/snippet}</Button>
    <Button variant="danger" onclick={doReset}>{#snippet children()}Reset everything{/snippet}</Button>
  {/snippet}
</Modal>

<Modal open={confirmBeta} title="Switch to beta channel?" onclose={() => { confirmBeta = false; pendingChannel = null; }}>
  {#snippet children()}
    <p class="text-sm">Beta builds may contain bugs and aren't suitable for live meetings. You can switch back to stable any time.</p>
  {/snippet}
  {#snippet footer()}
    <Button variant="ghost" onclick={() => { confirmBeta = false; pendingChannel = null; }}>{#snippet children()}Cancel{/snippet}</Button>
    <Button onclick={confirmBetaSwitch}>{#snippet children()}Switch to beta{/snippet}</Button>
  {/snippet}
</Modal>
