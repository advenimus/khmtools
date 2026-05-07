<script lang="ts">
  interface Option { value: string; label: string }
  interface Props {
    value?: string;
    options: Option[];
    id?: string;
    disabled?: boolean;
    class?: string;
  }
  let { value = $bindable(""), options, id, disabled = false, class: cls = "" }: Props = $props();
</script>

<select
  {id}
  {disabled}
  bind:value
  class="block h-10 w-full appearance-none rounded-md border border-border bg-bg px-3 pr-9 text-sm text-text focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 {cls}"
  style="background-image: url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2212%22 height=%2212%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%2364748B%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><polyline points=%226 9 12 15 18 9%22/></svg>'); background-repeat: no-repeat; background-position: right 10px center;"
>
  {#each options as opt}
    <option value={opt.value}>{opt.label}</option>
  {/each}
</select>
