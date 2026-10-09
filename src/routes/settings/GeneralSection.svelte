<script lang="ts">
  import Card from "../../lib/components/Card.svelte";
  import Button from "../../lib/components/Button.svelte";
  import Select from "../../lib/components/Select.svelte";
  import Toggle from "../../lib/components/Toggle.svelte";
  import SaveIndicator from "../../lib/components/SaveIndicator.svelte";
  import { api, errorMessage, type AppSettings, type ThemeMode } from "../../lib/api";
  import { autosave } from "../../lib/autosave.svelte";
  import { setTheme, theme as themeStore } from "../../lib/stores/theme";
  import { pushToast } from "../../lib/stores/toasts";

  interface Props {
    app: AppSettings;
    autoLaunchOn: boolean;
    onreset: () => void;
  }
  let { app = $bindable(), autoLaunchOn = $bindable(), onreset }: Props = $props();

  let changingLogin = $state(false);
  const saver = autosave(() => app, (v) => api.saveAppSettings(v));

  async function setRunAtLogon(enabled: boolean) {
    changingLogin = true;
    try {
      const actual = await api.autoLaunchSet(enabled);
      autoLaunchOn = actual;
      app = { ...app, run_at_logon: actual };
    } catch (e) {
      autoLaunchOn = !enabled;
      pushToast("danger", "Couldn't change Run at login", errorMessage(e));
    } finally {
      changingLogin = false;
    }
  }

  async function onThemeChange(t: ThemeMode) {
    app = { ...app, theme: t };
    try {
      await setTheme(t);
    } catch (e) {
      pushToast("danger", "Couldn't save the theme", errorMessage(e));
    }
  }

  const themes: { v: ThemeMode; l: string }[] = [
    { v: "system", l: "Match computer" },
    { v: "light", l: "Light" },
    { v: "dark", l: "Dark" },
  ];
</script>

<Card>
  <div class="space-y-6">
    <div>
      <div class="mb-3 text-sm font-semibold" id="theme-label">Theme</div>
      <div class="flex gap-2" role="group" aria-labelledby="theme-label">
        {#each themes as opt}
          <button
            class="rounded-md border px-3 py-1.5 text-xs transition {$themeStore === opt.v
              ? 'border-brand-solid bg-brand-solid text-white'
              : 'border-border hover:bg-surface-2'}"
            aria-pressed={$themeStore === opt.v}
            onclick={() => onThemeChange(opt.v)}
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
          description="The window fills the screen when KHM Tools opens."
        />
        <Toggle
          bind:checked={autoLaunchOn}
          disabled={changingLogin}
          label="Run at login"
          description="Start KHM Tools automatically when you sign in to this computer."
          onchange={setRunAtLogon}
        />
      </div>
    </div>

    <div>
      <label class="mb-3 block text-sm font-semibold" for="default-tool">Screen to show when KHM Tools opens</label>
      <Select
        id="default-tool"
        bind:value={app.default_tool}
        options={[
          { value: "dashboard", label: "Dashboard" },
          { value: "media", label: "Start Meeting" },
          { value: "zoom", label: "Launch Zoom" },
          { value: "attendance", label: "Attendance Calculator" },
        ]}
      />
    </div>

    <div class="flex items-center gap-3 border-t border-border pt-5">
      <SaveIndicator status={saver.status} error={saver.error} />
      <Button class="ml-auto" variant="danger" onclick={onreset}>
        {#snippet children()}Reset all settings{/snippet}
      </Button>
    </div>
  </div>
</Card>
