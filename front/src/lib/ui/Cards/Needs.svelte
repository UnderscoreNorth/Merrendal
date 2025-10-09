<script lang="ts">
  import { game, openModals } from "$lib/stores";
  import { capitalize } from "$lib/util/capitalize";
</script>

<div class="needs-container">
  <table>
    <tr
      ><th>Priority</th><th>Type</th><th
        ><button
          on:click={() => {
            $openModals["addNeeds"] = true;
          }}>+ Add Need</button
        ></th
      ></tr
    >
    {#each Object.values($game.needs).sort((a, b) => b.priority - a.priority) as need}
      <tr>
        <td>{need.priority.toFixed(1)}</td>
        <td>{capitalize(need.type)}</td>
        {#if need.type == "item"}
          <td style:text-align="right">{need.num.toFixed(2)}</td>
          <td>{need.item}</td>
        {:else if need.type == "area"}
          <td colspan="2">{need.area}</td>
        {:else if need.type == "building"}
          <td colspan="2">{need.building}</td>
        {:else if need.type == "itemCategory"}
          <td style:text-align="right">{need.num.toFixed(2)}</td>
          <td>{need.itemCategory}</td>
        {/if}
      </tr>
    {/each}
  </table>
</div>

<style>
  .needs-container {
    width: 100%;
  }
  button {
    font-family: inherit;
    width: 100%;
    color: gold;
    border: none;
    background-color: rgb(58, 59, 60);
    border-radius: 3px;
    cursor: pointer;
    padding: 6px;
    transition: all 0.2s ease;
  }
  button:hover {
    transform: translateY(-3px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
</style>
