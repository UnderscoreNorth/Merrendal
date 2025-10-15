<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import Collapsible from "../Collapsible.svelte";
  import type { Area } from "$lib/data/areas";

  function openAreaDetail(area: Area) {
    $openModals["areaDetail"] = area;
  }
</script>

<div class="container">
  {#each Array.from(new Set($game.areas.map((i) => i.type))) as areaType}
    {#if $game.areas.filter((i) => i.type == areaType).length}
      <Collapsible headerName={areaType} headerType={3} hidden={true}>
        {#each $game.areas.filter((i) => i.type == areaType) as area}
          <table>
            <tr>
              <th>Name</th>
              <td>
                {area.areaID}
                <button
                  class="inspect-btn"
                  on:click={() => openAreaDetail(area)}
                  title="View area details">
                  🔍
                </button>
              </td>
            </tr>
            <tr><th>Size</th><td>{area.acres} Acres</td></tr>
          </table>
        {/each}
      </Collapsible>
    {/if}
  {/each}
</div>

<style>
  .container {
    display: flex;
    gap: 3px;
    flex-direction: column;
    margin-top: 3px;
  }

  .inspect-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0 0.5em;
    font-size: inherit;
    vertical-align: middle;
  }

  .inspect-btn:hover {
    opacity: 0.7;
  }
</style>
