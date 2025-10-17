<script lang="ts">
  import { game, openModals } from "$lib/stores";
</script>

<h2>
  Population <button
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
    float: right;
    background: none;
    border: none;
    font-size: inherit;
    cursor: pointer;
    font-family: inherit;
  }
</style>
