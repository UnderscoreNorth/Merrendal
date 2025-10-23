<script lang="ts">
  import { game } from "$lib/stores";
  import ProjectRows from "../Sub/ProjectRows.svelte";
  let projects = Object.values($game.areas)
    .map((i) => i.currentProjects)
    .flat();
  game.subscribe((gs) => {
    projects = Object.values(gs.areas)
      .map((i) => i.currentProjects)
      .flat();
  });
</script>

<table>
  <ProjectRows {projects} />
</table>
