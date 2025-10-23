<script lang="ts">
  import { game } from "$lib/stores";
  import ToolTip from "../Components/ToolTip.svelte";
  let toolTip = "";
</script>

<table>
  <tr>
    <td
      on:mouseleave={() => (toolTip = "")}
      on:mouseover={() => (toolTip = "Stability")}>Stability:</td
    ><td> {$game.village.stability}</td>
  </tr>
  <tr>
    <td
      on:mouseleave={() => (toolTip = "")}
      on:mouseover={() => (toolTip = "Authority")}>Authority:</td
    ><td> {$game.village.authority}</td>
  </tr>
</table>
{#if toolTip == "Stability"}
  <ToolTip>Stability affects birthrate and trade</ToolTip>
{/if}

{#if toolTip == "Authority"}
  <ToolTip>Authority affects stability</ToolTip>
{/if}
