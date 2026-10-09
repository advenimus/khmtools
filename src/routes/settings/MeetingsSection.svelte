<script lang="ts">
  import { onMount } from "svelte";
  import Card from "../../lib/components/Card.svelte";
  import Select from "../../lib/components/Select.svelte";
  import TextInput from "../../lib/components/TextInput.svelte";
  import SaveIndicator from "../../lib/components/SaveIndicator.svelte";
  import { api, type MeetingSettings, type MeetingInputCheck } from "../../lib/api";
  import { autosave } from "../../lib/autosave.svelte";

  let { meeting = $bindable() }: { meeting: MeetingSettings } = $props();

  let check = $state<MeetingInputCheck | null>(null);

  const saver = autosave(
    () => meeting,
    async (m) => {
      const result = await api.checkMeetingInput(m.meeting_id, m.passcode);
      check = result;
      if (!result.valid) throw new Error(result.message ?? "Check the meeting ID.");
      await api.saveMeetingSettings(m);
    }
  );

  onMount(async () => {
    try {
      check = await api.checkMeetingInput(meeting.meeting_id, meeting.passcode);
    } catch (e) {
      console.error("Couldn't check the saved meeting ID", e);
    }
  });

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

<Card>
  <div class="space-y-6">
    <div class="space-y-3">
      <div class="text-sm font-semibold">Zoom meeting</div>
      <label class="block">
        <span class="mb-1 block text-xs text-text-mute">Meeting ID or invite link</span>
        <TextInput
          bind:value={meeting.meeting_id}
          placeholder="e.g. 123 4567 8901, or paste the zoom.us link"
          invalid={check?.valid === false}
          aria-describedby="meeting-id-help"
        />
      </label>
      <div id="meeting-id-help" class="text-xs {check?.valid === false ? 'text-danger' : 'text-text-mute'}">
        {#if check?.valid === false}
          {check.message}
        {:else if check?.meeting_id}
          Will join meeting {check.meeting_id}{check.has_passcode ? " with its passcode" : ""}.
        {:else}
          9 to 11 digits. You can paste the whole invite link and the passcode is picked up too.
        {/if}
      </div>
      <label class="block">
        <span class="mb-1 block text-xs text-text-mute">Passcode (optional)</span>
        <TextInput bind:value={meeting.passcode} placeholder="Only if Zoom asks for one" />
      </label>
    </div>

    <div>
      <div class="mb-1 text-sm font-semibold">Midweek meeting</div>
      <div class="grid grid-cols-2 gap-3">
        <Select bind:value={meeting.midweek.day} options={dayMid} aria-label="Midweek meeting day" />
        <TextInput bind:value={meeting.midweek.time} type="time" aria-label="Midweek meeting start time" />
      </div>
    </div>

    <div>
      <div class="mb-1 text-sm font-semibold">Weekend meeting</div>
      <div class="grid grid-cols-2 gap-3">
        <Select bind:value={meeting.weekend.day} options={dayWeekend} aria-label="Weekend meeting day" />
        <TextInput bind:value={meeting.weekend.time} type="time" aria-label="Weekend meeting start time" />
      </div>
      <p class="mt-2 text-xs text-text-mute">
        A "weekend meetings only" reminder shows on this day until 3 hours after the start time.
      </p>
    </div>

    <div class="border-t border-border pt-5">
      <SaveIndicator status={saver.status} error={saver.error} />
    </div>
  </div>
</Card>
