<script lang="ts">
  import { game, openModals } from "$lib/stores";

  let tab: "table" | "tree" = "table";
</script>

<h2>
  Population
  <button
    class="close"
    on:click={() => {
      $openModals["population"] = undefined;
    }}>X</button>
</h2>
<table>
  <tr
    ><th>Name</th><th>Title</th><th>Age</th><th>Hunger</th><th>Health</th><th
      >Skills</th
    ></tr>
  {#each [...$game.npcs].sort((a, b) => b.age - a.age) as npc}
    <tr>
      <td>{npc.fName}</td><td>{npc.job?.title}</td><td class="num"
        >{npc.age}</td>
      <td>{npc.hunger}</td><td>{npc.health}</td>
      {#each Object.entries(npc.skills)
        .sort((a, b) => b[1] - a[1])
        .filter((s) => s[1] >= 0) as [skill, value]}
        <td>{skill}:</td><td class="num">{(value * 100).toFixed(2)}%</td>
      {/each}
    </tr>
  {/each}
</table>

<style>
  .num {
    text-align: right;
  }
  button {
    background: none;
    border: none;
    font-size: inherit;
    cursor: pointer;
    font-family: inherit;
  }
  .close {
    float: right;
  }
  .family-trees {
    max-height: 75vh;
    overflow: auto;
    padding: 0 1em 1em 1em;
  }
  .legend {
    display: flex;
    gap: 1.5em;
    margin-bottom: 1em;
    font-size: 0.9em;
    flex-wrap: wrap;
  }
  .legend-item {
    display: flex;
    align-items: center;
    gap: 0.5em;
  }
  .alive-box,
  .dead-box {
    width: 20px;
    height: 20px;
    border-radius: 4px;
    display: inline-block;
    border: 2px solid #333;
  }
  .alive-box {
    background: linear-gradient(135deg, #4caf50 0%, #81c784 100%);
  }
  .dead-box {
    background: linear-gradient(135deg, #757575 0%, #bdbdbd 100%);
  }
  .marriage-line {
    width: 30px;
    height: 3px;
    display: inline-block;
    background: #d32f2f;
    border-top: 3px dashed #d32f2f;
  }
  .parent-line {
    width: 30px;
    height: 3px;
    display: inline-block;
    background: #666;
    border-top: 2px solid #666;
  }
  h3 {
    margin-top: 0;
  }
</style>
