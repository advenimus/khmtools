<script lang="ts">
  import Card from "../../lib/components/Card.svelte";
  import Select from "../../lib/components/Select.svelte";
  import TextInput from "../../lib/components/TextInput.svelte";
  import NumberInput from "../../lib/components/NumberInput.svelte";
  import Toggle from "../../lib/components/Toggle.svelte";
  import SaveIndicator from "../../lib/components/SaveIndicator.svelte";
  import { api, type MediaLauncherSettings } from "../../lib/api";
  import { autosave } from "../../lib/autosave.svelte";

  const MIN_SECONDS = 1;
  const MAX_SECONDS = 60;

  let { media = $bindable() }: { media: MediaLauncherSettings } = $props();

  const saver = autosave(() => media, (m) => api.saveMediaLauncherSettings(m));
</script>

<Card>
  <div class="space-y-6">
    <div>
      <div class="mb-3 text-sm font-semibold">Programs to open with Start Meeting</div>
      <div class="space-y-3">
        <Toggle bind:checked={media.toggles.launch_obs} label="OBS Studio" description="Opens with its virtual camera turned on." />
        <Toggle bind:checked={media.toggles.launch_media_manager} label="Meeting Media Manager" />
        <Toggle bind:checked={media.toggles.launch_zoom} label="Zoom" description="Joins your meeting from the Meetings tab." />
      </div>
    </div>

    <div>
      <div class="mb-3 text-sm font-semibold">Reminder popup</div>
      <div class="space-y-3">
        <label class="block">
          <span class="mb-1 block text-xs text-text-mute">When to show it</span>
          <Select
            bind:value={media.custom_message.display_when}
            options={[
              { value: "none", label: "Never" },
              { value: "always", label: "Every time" },
              { value: "weekend", label: "Weekend meeting day only" },
            ]}
          />
        </label>
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
        <label class="block max-w-[12rem]">
          <span class="mb-1 block text-xs text-text-mute">Seconds to show it ({MIN_SECONDS}–{MAX_SECONDS})</span>
          <NumberInput bind:value={media.custom_message.display_time_seconds} min={MIN_SECONDS} max={MAX_SECONDS} />
        </label>
      </div>
    </div>

    <div class="border-t border-border pt-5">
      <SaveIndicator status={saver.status} error={saver.error} />
    </div>
  </div>
</Card>
