<script lang="ts">
  import { onMount } from "svelte";
  import Button from "../lib/components/Button.svelte";
  import TextInput from "../lib/components/TextInput.svelte";
  import Select from "../lib/components/Select.svelte";
  import LogoMark from "../lib/components/LogoMark.svelte";
  import { api, errorMessage, type CustomMessageDisplay } from "../lib/api";
  import { pushToast } from "../lib/stores/toasts";

  let { ondone }: { ondone: () => void } = $props();

  type PcPurpose = "host" | "attendant" | "other";

  const data = $state({
    meetingId: "",
    passcode: "",
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
    reminderWhen: "weekend" as Exclude<CustomMessageDisplay, "none">,
    displaySeconds: 5,
    autoLaunch: false,
  });

  let step = $state(1);
  let saving = $state(false);
  let skipping = $state(false);
  let meetingError = $state<string | null>(null);
  const totalSteps = 7;

  // A previous attempt may have saved some answers before failing; start from them.
  onMount(async () => {
    try {
      const [meeting, media, app, autoOn] = await Promise.all([
        api.getMeetingSettings(),
        api.getMediaLauncherSettings(),
        api.getAppSettings(),
        api.autoLaunchEnabled().catch(() => false),
      ]);
      data.meetingId = meeting.meeting_id;
      data.passcode = meeting.passcode;
      data.midweekDay = meeting.midweek.day;
      data.midweekTime = meeting.midweek.time;
      data.weekendDay = meeting.weekend.day;
      data.weekendTime = meeting.weekend.time;
      data.useObs = media.toggles.launch_obs;
      data.useMediaManager = media.toggles.launch_media_manager;
      data.useReminder = media.custom_message.display_when !== "none";
      if (media.custom_message.display_when !== "none") data.reminderWhen = media.custom_message.display_when;
      data.reminderTitle = media.custom_message.title || data.reminderTitle;
      data.reminderMessage = media.custom_message.message || data.reminderMessage;
      data.displaySeconds = media.custom_message.display_time_seconds;
      data.pcPurpose = app.default_tool === "media" ? "host" : app.default_tool === "zoom" ? "attendant" : "other";
      data.autoLaunch = autoOn;
    } catch (e) {
      console.error("Couldn't preload settings for setup", e);
    }
  });

  async function finish() {
    if (saving) return;
    saving = true;
    try {
      await api.saveMeetingSettings({
        meeting_id: data.meetingId,
        passcode: data.passcode,
        midweek: { day: data.midweekDay, time: data.midweekTime },
        weekend: { day: data.weekendDay, time: data.weekendTime },
      });

      await api.saveMediaLauncherSettings({
        toggles: {
          launch_obs: data.useObs,
          launch_media_manager: data.useMediaManager,
          launch_zoom: true,
        },
        custom_message: {
          display_when: data.useReminder ? data.reminderWhen : "none",
          title: data.reminderTitle,
          message: data.reminderMessage,
          display_time_seconds: data.displaySeconds,
        },
      });

      const app = await api.getAppSettings();
      const default_tool =
        data.pcPurpose === "host" ? "media" : data.pcPurpose === "attendant" ? "zoom" : "dashboard";
      await api.saveAppSettings({ ...app, default_tool });

      try {
        const on = await api.autoLaunchSet(data.autoLaunch);
        if (on !== data.autoLaunch) {
          pushToast("warning", "Run at login didn't change", "You can try again in Settings → General.");
        }
      } catch (e) {
        pushToast("warning", "Run at login didn't change", errorMessage(e));
      }

      await api.onboardingComplete();
      ondone();
    } catch (e) {
      pushToast("danger", "Setup didn't finish", errorMessage(e));
    } finally {
      saving = false;
    }
  }

  async function validateMeeting(): Promise<boolean> {
    try {
      const check = await api.checkMeetingInput(data.meetingId, data.passcode);
      meetingError = check.valid ? null : check.message;
      return check.valid;
    } catch (e) {
      meetingError = errorMessage(e);
      return false;
    }
  }

  async function next() {
    if (step === 1 && !(await validateMeeting())) return;
    if (step < totalSteps) step++;
    else await finish();
  }

  function back() {
    if (step > 1) step--;
  }

  async function skip() {
    if (skipping) return;
    skipping = true;
    try {
      await api.onboardingComplete();
      ondone();
    } catch (e) {
      pushToast("danger", "Couldn't skip setup", errorMessage(e));
    } finally {
      skipping = false;
    }
  }

  function optionCls(selected: boolean) {
    return `flex cursor-pointer items-start gap-3 rounded-md border p-3 hover:bg-surface-2 ${
      selected ? "border-brand bg-brand/5" : "border-border"
    }`;
  }

  const yesNo = (yes: string, no: string) => [
    { v: true, l: yes },
    { v: false, l: no },
  ];
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
    <Button variant="ghost" size="sm" loading={skipping} disabled={saving} onclick={skip}>
      {#snippet children()}Skip setup{/snippet}
    </Button>
  </header>

  <div class="h-1 bg-surface-2" role="progressbar" aria-valuemin={1} aria-valuemax={totalSteps} aria-valuenow={step}>
    <div class="h-full bg-brand transition-[width] duration-200" style="width: {(step / totalSteps) * 100}%;"></div>
  </div>

  <form
    class="flex flex-1 flex-col overflow-hidden"
    onsubmit={(e) => { e.preventDefault(); next(); }}
  >
    <main class="flex-1 overflow-auto">
      <div class="mx-auto max-w-xl px-6 py-10 fade-in" data-step={step}>
        {#if step === 1}
          <h2 class="text-xl font-semibold">Your Zoom meeting</h2>
          <p class="mt-1 text-sm text-text-mute">
            Your congregation's regular Zoom meeting ID. You can paste the whole invite link. Leave it blank to skip; you can add it later in Settings.
          </p>
          <div class="mt-6 space-y-3">
            <label class="block">
              <span class="mb-1 block text-xs text-text-mute">Meeting ID or invite link</span>
              <TextInput
                bind:value={data.meetingId}
                placeholder="e.g. 123 4567 8901"
                invalid={meetingError !== null}
                aria-describedby="onboarding-meeting-help"
              />
            </label>
            <div id="onboarding-meeting-help" class="text-xs {meetingError ? 'text-danger' : 'text-text-mute'}">
              {meetingError ?? "9 to 11 digits."}
            </div>
            <label class="block">
              <span class="mb-1 block text-xs text-text-mute">Passcode (optional)</span>
              <TextInput bind:value={data.passcode} placeholder="Only if Zoom asks for one" />
            </label>
          </div>
        {:else if step === 2}
          <h2 class="text-xl font-semibold">Meeting schedule</h2>
          <p class="mt-1 text-sm text-text-mute">When your meetings start. The optional reminder popup uses the weekend day and time.</p>
          <div class="mt-6 space-y-5">
            <div>
              <div class="mb-2 text-sm font-medium">Midweek meeting</div>
              <div class="grid grid-cols-2 gap-3">
                <Select
                  bind:value={data.midweekDay}
                  aria-label="Midweek meeting day"
                  options={[
                    { value: "monday", label: "Monday" },
                    { value: "tuesday", label: "Tuesday" },
                    { value: "wednesday", label: "Wednesday" },
                    { value: "thursday", label: "Thursday" },
                    { value: "friday", label: "Friday" },
                  ]}
                />
                <TextInput bind:value={data.midweekTime} type="time" aria-label="Midweek meeting start time" />
              </div>
            </div>
            <div>
              <div class="mb-2 text-sm font-medium">Weekend meeting</div>
              <div class="grid grid-cols-2 gap-3">
                <Select
                  bind:value={data.weekendDay}
                  aria-label="Weekend meeting day"
                  options={[
                    { value: "saturday", label: "Saturday" },
                    { value: "sunday", label: "Sunday" },
                  ]}
                />
                <TextInput bind:value={data.weekendTime} type="time" aria-label="Weekend meeting start time" />
              </div>
            </div>
          </div>
        {:else if step === 3}
          <h2 class="text-xl font-semibold">Meeting Media Manager</h2>
          <p class="mt-1 text-sm text-text-mute">Do you use Meeting Media Manager (M³) to show videos and pictures during meetings?</p>
          <fieldset class="mt-6 space-y-2">
            <legend class="sr-only">Use Meeting Media Manager</legend>
            {#each yesNo("Yes, I use Meeting Media Manager", "No, I don't use it") as o}
              <label class={optionCls(data.useMediaManager === o.v)}>
                <input type="radio" name="mmm" checked={data.useMediaManager === o.v} onchange={() => (data.useMediaManager = o.v)} />
                <span class="text-sm">{o.l}</span>
              </label>
            {/each}
          </fieldset>
          <p class="mt-3 text-xs text-text-mute">If KHM Tools can't find it, you can pick it later in Settings → Program Locations.</p>
        {:else if step === 4}
          <h2 class="text-xl font-semibold">OBS Studio</h2>
          <p class="mt-1 text-sm text-text-mute">Do you use OBS Studio to send the stage camera into Zoom?</p>
          <fieldset class="mt-6 space-y-2">
            <legend class="sr-only">Use OBS Studio</legend>
            {#each yesNo("Yes, I use OBS Studio", "No, I don't use it") as o}
              <label class={optionCls(data.useObs === o.v)}>
                <input type="radio" name="obs" checked={data.useObs === o.v} onchange={() => (data.useObs = o.v)} />
                <span class="text-sm">{o.l}</span>
              </label>
            {/each}
          </fieldset>
          <p class="mt-3 text-xs text-text-mute">If KHM Tools can't find it, you can pick it later in Settings → Program Locations.</p>
        {:else if step === 5}
          <h2 class="text-xl font-semibold">What is this computer for?</h2>
          <p class="mt-1 text-sm text-text-mute">This decides which screen opens first.</p>
          <fieldset class="mt-6 space-y-2">
            <legend class="sr-only">Computer purpose</legend>
            {#each [
              { v: "host", l: "Runs the meeting (video and Zoom host)", d: "Opens Start Meeting." },
              { v: "attendant", l: "Zoom attendant", d: "Opens Launch Zoom." },
              { v: "other", l: "Something else", d: "Opens the dashboard." },
            ] as o}
              <label class={optionCls(data.pcPurpose === o.v)}>
                <input class="mt-1" type="radio" name="purpose" checked={data.pcPurpose === o.v} onchange={() => (data.pcPurpose = o.v as PcPurpose)} />
                <div>
                  <div class="text-sm font-medium">{o.l}</div>
                  <div class="text-xs text-text-mute">{o.d}</div>
                </div>
              </label>
            {/each}
          </fieldset>
        {:else if step === 6}
          <h2 class="text-xl font-semibold">Reminder popup</h2>
          <p class="mt-1 text-sm text-text-mute">An optional checklist that shows before Start Meeting opens your programs.</p>
          <fieldset class="mt-6 space-y-2">
            <legend class="sr-only">Show a reminder</legend>
            {#each yesNo("Yes, show a reminder", "No reminder") as o}
              <label class={optionCls(data.useReminder === o.v)}>
                <input type="radio" name="reminder" checked={data.useReminder === o.v} onchange={() => (data.useReminder = o.v)} />
                <span class="text-sm">{o.l}</span>
              </label>
            {/each}
            {#if data.useReminder}
              <div class="space-y-3 pt-3">
                <Select
                  bind:value={data.reminderWhen}
                  aria-label="When to show the reminder"
                  options={[
                    { value: "weekend", label: "Weekend meeting day only" },
                    { value: "always", label: "Every time" },
                  ]}
                />
                <TextInput bind:value={data.reminderTitle} placeholder="Reminder title" aria-label="Reminder title" />
                <textarea
                  bind:value={data.reminderMessage}
                  rows="5"
                  aria-label="Reminder message"
                  class="block w-full resize-y rounded-md border border-border bg-bg p-3 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20"
                ></textarea>
              </div>
            {/if}
          </fieldset>
        {:else if step === 7}
          <h2 class="text-xl font-semibold">Start with the computer?</h2>
          <p class="mt-1 text-sm text-text-mute">Should KHM Tools open by itself when you sign in?</p>
          <fieldset class="mt-6 space-y-2">
            <legend class="sr-only">Run at login</legend>
            {#each yesNo("Yes, open it when I sign in", "No, I'll open it myself") as o}
              <label class={optionCls(data.autoLaunch === o.v)}>
                <input type="radio" name="autolaunch" checked={data.autoLaunch === o.v} onchange={() => (data.autoLaunch = o.v)} />
                <span class="text-sm">{o.l}</span>
              </label>
            {/each}
          </fieldset>
        {/if}
      </div>
    </main>

    <footer class="flex items-center justify-between border-t border-border px-6 py-4">
      <Button variant="ghost" disabled={step === 1 || saving} onclick={back}>{#snippet children()}Back{/snippet}</Button>
      <Button type="submit" loading={saving}>
        {#snippet children()}{step === totalSteps ? "Finish setup" : "Next"}{/snippet}
      </Button>
    </footer>
  </form>
</div>
