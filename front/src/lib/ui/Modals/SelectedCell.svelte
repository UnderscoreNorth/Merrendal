<script lang="ts">
  import { TerrainTile } from "$lib/map/generation";
  import { map, openModals } from "$lib/stores";

  $: cell = $openModals["selectedCell"] as TerrainTile;
  function triggerChange() {
    $map = [...$map];
  }
</script>

<div class="container">
  <span>{cell.q}, {cell.s}, {cell.r} </span>
  <hr />
  <table>
    <tr>
      <td>Coverage</td><td
        ><input
          type="number"
          on:change={triggerChange}
          bind:value={cell.forested}
          max="100"
          min="0" /></td>
    </tr>
    <tr>
      <td>Elevation</td><td
        ><input
          type="number"
          on:change={triggerChange}
          bind:value={cell.elevation} /></td
      ></tr>
    <tr>
      <td>Type</td><td
        ><select on:change={triggerChange} bind:value={cell.type}>
          <option>plain</option>
          <option>mountain</option>
          <option>sand</option>
          <option>water</option>
          <option>village</option>
          <option>farmland</option>
        </select></td
      ></tr>
  </table>
</div>

<style>
  .container {
    width: 15rem;
  }
  input {
    width: 4rem;
    padding: 0.5rem;
  }
  select {
    padding: 0.5rem;
  }
</style>
