<script lang="ts">
  import { createEventDispatcher } from "svelte";
  import Button from "../lib/components/Button.svelte";
  import TextInput from "../lib/components/TextInput.svelte";
  import Select from "../lib/components/Select.svelte";
  import LogoMark from "../lib/components/LogoMark.svelte";
  import { api } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  const dispatch = createEventDispatcher();

  type PcPurpose = "host" | "attendant" | "other";

  const data = $state({
    meetingId: "",
    midweekDay: "tuesday",
    midweekTime: "19:30",
    weekendDay: "sunday",
    weekendTime: "10:00",
    useMediaManager: false,
    useObs: false,
    pcPurpose: "host" as PcPurpose,
    useReminder: false,
    reminderTitle: "Pre-Meeting Checklist",
    reminderMessage:
      "Remember to:\n• Add the speaker's opening song and photo\n• Wait for media files to sync\n• Check with the AV servant for any special items",
    reminderWhen: "weekend",
    autoLaunch: false,
  });

  let step = $state(1);
  const totalSteps = 7;

  async function finish() {
    try {
      // 1. Meeting settings
      await api.saveMeetingSettings({
        meeting_id: data.meetingId,
        midweek: { day: data.midweekDay, time: data.midweekTime },
        weekend: { day: data.weekendDay, time: data.weekendTime },
      });

      // 2. Media launcher toggles + custom message
      await api.saveMediaLauncherSettings({
        toggles: {
          launch_obs: data.useObs,
          launch_media_manager: data.useMediaManager,
          launch_zoom: true,
        },
        custom_message: {
          display_when: data.useReminder ? (data.reminderWhen as any) : "none",
          title: data.reminderTitle,
          message: data.reminderMessage,
          display_time_seconds: 5,
        },
      });

      // 3. App settings + auto-launch
      const app = await api.getAppSettings();
      const default_tool =
        data.pcPurpose === "host" ? "media" : data.pcPurpose === "attendant" ? "zoom" : "dashboard";
      await api.saveAppSettings({
        ...app,
        default_tool,
        always_maximize: data.autoLaunch,
        run_at_logon: data.autoLaunch,
      });
      if (data.autoLaunch) await api.autoLaunchSet(true);

      await api.onboardingComplete();
      dispatch("done");
    } catch (e: any) {
      pushToast("danger", "Setup failed", String(e?.message ?? e));
    }
  }

  function next() { if (step < totalSteps) step++; else finish(); }
  function back() { if (step > 1) step--; }
  async function skip() { await api.onboardingComplete(); dispatch("done"); }
</script>

<div class="flex h-full flex-col bg-bg">
  <header class="flex items-center justify-between border-b border-border px-6 py-4">
    <div class="flex items-center gap-3">
      <LogoMark size={32} />
      <div>
        <div class="text-base font-semibold">Welcome to KHM Tools</div>
        <div class="text-xs text-text-mute">Step {step} of {totalSteps}</div>
      </div>
    </div>
    <button class="text-xs text-text-mute hover:text-text" onclick={skip}>Skip setup</button>
  </header>

  <div class="h-1 bg-surface-2">
    <div class="h-full bg-brand transition-[width] duration-200" style="width: {(step / totalSteps) * 100}%;"></div>
  </div>

  <main class="flex-1 overflow-auto">
    <div class="mx-auto max-w-xl px-6 py-10 fade-in" data-step={step}>
      {#if step === 1}
        <h2 class="text-xl font-semibold">Meeting credentials</h2>
        <p class="mt-1 text-sm text-text-mute">Your congregation's recurring Zoom meeting ID. You can change this any time in Settings.</p>
        <div class="mt-6">
          <TextInput bind:value={data.meetingId} placeholder="123 4567 8901" />
        </div>
      {:else if step === 2}
        <h2 class="text-xl font-semibold">Meeting schedule</h2>
        <p class="mt-1 text-sm text-text-mute">Used by the optional weekend-only reminder popup.</p>
        <div class="mt-6 space-y-5">
          <div>
            <div class="mb-2 text-sm font-medium">Midweek meeting</div>
            <div class="grid grid-cols-2 gap-3">
              <Select
                bind:value={data.midweekDay}
                options={[
                  { value: "monday", label: "Monday" },
                  { value: "tuesday", label: "Tuesday" },
                  { value: "wednesday", label: "Wednesday" },
                  { value: "thursday", label: "Thursday" },
                  { value: "friday", label: "Friday" },
                ]}
              />
              <TextInput bind:value={data.midweekTime} type="time" />
            </div>
          </div>
          <div>
            <div class="mb-2 text-sm font-medium">Weekend meeting</div>
            <div class="grid grid-cols-2 gap-3">
              <Select
                bind:value={data.weekendDay}
                options={[
                  { value: "saturday", label: "Saturday" },
                  { value: "sunday", label: "Sunday" },
                ]}
              />
              <TextInput bind:value={data.weekendTime} type="time" />
            </div>
          </div>
        </div>
      {:else if step === 3}
        <h2 class="text-xl font-semibold">Meeting Media Manager</h2>
        <p class="mt-1 text-sm text-text-mute">Do you use Meeting Media Manager (M³) for displaying media during meetings?</p>
        <div class="mt-6 space-y-2">
          {#each [{ v: true, l: "Yes, I use Meeting Media Manager" }, { v: false, l: "No, I don't use it" }] as o}
            <label class="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
              class:border-brand={data.useMediaManager === o.v}>
              <input type="radio" checked={data.useMediaManager === o.v} onchange={() => (data.useMediaManager = o.v)} />
              <span class="text-sm">{o.l}</span>
            </label>
          {/each}
        </div>
      {:else if step === 4}
        <h2 class="text-xl font-semibold">OBS Studio</h2>
        <p class="mt-1 text-sm text-text-mute">Do you use OBS Studio with virtual camera output?</p>
        <div class="mt-6 space-y-2">
          {#each [{ v: true, l: "Yes, I use OBS Studio" }, { v: false, l: "No, I don't use it" }] as o}
            <label class="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
              class:border-brand={data.useObs === o.v}>
              <input type="radio" checked={data.useObs === o.v} onchange={() => (data.useObs = o.v)} />
              <span class="text-sm">{o.l}</span>
            </label>
          {/each}
        </div>
      {:else if step === 5}
        <h2 class="text-xl font-semibold">PC purpose</h2>
        <p class="mt-1 text-sm text-text-mute">What do you primarily use this PC for? Determines which tool opens by default.</p>
        <div class="mt-6 space-y-2">
          {#each [
            { v: "host", l: "Zoom Video Host PC", d: "Opens the meeting launch sequence." },
            { v: "attendant", l: "Zoom Attendant PC", d: "Opens the Zoom launcher." },
            { v: "other", l: "Other / general use", d: "Opens the dashboard." },
          ] as o}
            <label class="flex cursor-pointer items-start gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
              class:border-brand={data.pcPurpose === o.v}>
              <input class="mt-1" type="radio" checked={data.pcPurpose === o.v} onchange={() => (data.pcPurpose = o.v as PcPurpose)} />
              <div>
                <div class="text-sm font-medium">{o.l}</div>
                <div class="text-xs text-text-mute">{o.d}</div>
              </div>
            </label>
          {/each}
        </div>
      {:else if step === 6}
        <h2 class="text-xl font-semibold">Pre-meeting reminder</h2>
        <p class="mt-1 text-sm text-text-mute">Optional popup shown before the launch sequence starts.</p>
        <div class="mt-6 space-y-2">
          {#each [{ v: true, l: "Yes, show a reminder" }, { v: false, l: "No reminder" }] as o}
            <label class="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
              class:border-brand={data.useReminder === o.v}>
              <input type="radio" checked={data.useReminder === o.v} onchange={() => (data.useReminder = o.v)} />
              <span class="text-sm">{o.l}</span>
            </label>
          {/each}
          {#if data.useReminder}
            <div class="space-y-3 pt-3">
              <Select
                bind:value={data.reminderWhen}
                options={[
                  { value: "weekend", label: "Weekend meetings only" },
                  { value: "always", label: "All meetings" },
                ]}
              />
              <TextInput bind:value={data.reminderTitle} placeholder="Reminder title" />
              <textarea
                bind:value={data.reminderMessage}
                rows="5"
                class="block w-full resize-y rounded-md border border-border bg-bg p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
              ></textarea>
            </div>
          {/if}
        </div>
      {:else if step === 7}
        <h2 class="text-xl font-semibold">Run at login</h2>
        <p class="mt-1 text-sm text-text-mute">Should KHM Tools start automatically when you sign in?</p>
        <div class="mt-6 space-y-2">
          {#each [{ v: true, l: "Yes, start at login" }, { v: false, l: "No, I'll launch it manually" }] as o}
            <label class="flex cursor-pointer items-center gap-3 rounded-md border border-border p-3 hover:bg-surface-2"
              class:border-brand={data.autoLaunch === o.v}>
              <input type="radio" checked={data.autoLaunch === o.v} onchange={() => (data.autoLaunch = o.v)} />
              <span class="text-sm">{o.l}</span>
            </label>
          {/each}
        </div>
      {/if}
    </div>
  </main>

  <footer class="flex items-center justify-between border-t border-border px-6 py-4">
    <Button variant="ghost" disabled={step === 1} onclick={back}>{#snippet children()}Back{/snippet}</Button>
    <Button onclick={next}>
      {#snippet children()}{step === totalSteps ? "Finish setup" : "Next"}{/snippet}
    </Button>
  </footer>
</div>
