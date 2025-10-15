<script lang="ts">
  import { game } from "$lib/stores";
  $: occupations = Array.from(
    new Set($game.npcs.map((i) => i?.job?.title ?? "None")),
  );
  $: npcs = $game.npcs;
  function getArray(ageDecade: number) {
    let arr = [];
    for (let i = ageDecade; i >= ageDecade - 9; i--) {
      arr.push(i);
    }
    return arr;
  }
</script>

<div style:display={"flex"}>
  <table style:height={"min-content"}>
    {#each [...occupations.filter((i) => i !== "None").sort()] as job}
      <tr
        ><th>{job}</th><td
          >{npcs.filter((i) => i?.job?.title == job).length}</td>
      </tr>
    {/each}
    <tr
      ><th>Unemployed</th><td
        >{npcs.filter((i) => i?.job?.title == "None" && i.age >= 16).length}</td
      ></tr>
    <tr><th>Adults</th><td>{npcs.filter((i) => i.age >= 16).length}</td></tr>
    <tr><th>Children</th><td>{npcs.filter((i) => i.age < 16).length}</td></tr>
    <tr><th>Dead</th><td>{$game.deadNpcs.length}</td></tr>
  </table>
  <div>
    {#each [60, 50, 40, 30, 20, 10] as ageDecade}
      <div class="ageDecadeContainer">
        <span>{ageDecade - 9}-{ageDecade}</span>
        <div class="ageBarContainer">
          {#each getArray(ageDecade) as age}
            <div
              class="ageBar"
              style:width={`${npcs.filter((i) => i.age == age).length * 7}px`}>
            </div>
          {/each}
        </div>
      </div>
    {/each}
  </div>
</div>

<style>
  table {
    width: 100%;
    border-collapse: collapse;
    min-width: 8rem;
  }

  table th,
  table td {
    text-align: left;
  }

  table th {
    width: 6rem;
    font-style: italic;
  }
  .ageBar {
    height: 2px;
    background: black;
    display: inline-block;
  }
  .ageBarContainer {
    display: grid;
    grid-auto-columns: min-content;
    height: 20px;
  }
  .ageDecadeContainer {
    display: grid;
    grid-template-columns: 3rem auto;
  }
</style>
