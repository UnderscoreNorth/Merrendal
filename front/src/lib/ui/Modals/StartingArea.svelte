<script lang="ts">
  import { type Area } from "$lib/data/areas";
  import { startConstruction } from "$lib/simulation/buildings";
  import { game, openModals } from "$lib/stores";
  let area = $openModals["startingArea"] as Area;
  openModals.subscribe((a) => {
    area = $openModals["startingArea"];
  });
  function selectArea() {
    Object.values($game.areas).push(area);
    startConstruction($game, "Dirt Road", area, true);
    $game.areas = $game.areas;
  }
</script>

<h2>Pick a starting tile.</h2>
<div class="contents">
  {#if $openModals["startingArea"] !== undefined}
    <div>Location: {area.areaID}</div>
    <div>Island: {area.groupID}</div>
    <div>Total Acres: {area.acres}</div>
    <div style:margin-bottom="1rem">
      Tree Coverage: {area.terrain.forested.toFixed(0)}%
    </div>
    <button on:click={selectArea}>Select</button>
  {/if}
</div>

<style>
  .contents {
    display: flex;
    flex-direction: column;
  }
  button {
    font-family: inherit;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
  }
</style>
