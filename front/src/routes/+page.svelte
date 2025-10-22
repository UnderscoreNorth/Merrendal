<script lang="ts">
  import "./styles.css";
  import { init } from "$lib/init";
  import { loadGame } from "$lib/storage";
  import { game, mouseCood, openModals, tileSelection } from "$lib/stores";
  import Collapsible from "$lib/ui/Collapsible.svelte";
  import Areas from "$lib/ui/Cards/Areas.svelte";
  import Logs from "$lib/ui/Cards/Logs.svelte";
  import Map from "$lib/ui/Map/Map.svelte";
  import Time from "$lib/ui/Cards/Time.svelte";
  import Population from "$lib/ui/Cards/Population.svelte";
  import Supplies from "$lib/ui/Cards/Supplies.svelte";
  import Card from "$lib/ui/Cards/Card.svelte";
  import Modal from "$lib/ui/Modals/Modal.svelte";
  import PopulationModal from "$lib/ui/Modals/PopulationModal.svelte";
  import SelectedCell from "$lib/ui/Modals/SelectedCell.svelte";
  import AreaDetail from "$lib/ui/Modals/AreaDetail.svelte";
  import StartingArea from "$lib/ui/Modals/StartingArea.svelte";
  import TileSelectionModal from "$lib/ui/Modals/TileSelectionModal.svelte";
  import Debug from "$lib/ui/Cards/Debug.svelte";

  // Load from localStorage if available, otherwise initialize new game
  const loaded = loadGame();
  if (!loaded) {
    init();
  }
</script>

<svelte:head><title>Legacy of Merrendal</title></svelte:head>

<svelte:window
  on:mousemove={(e) => {
    $mouseCood = { x: e.clientX, y: e.clientY };
  }} />
<div class="game-container">
  <Modal>
    <Card draggable={true} padding={1} modal="population">
      <PopulationModal />
    </Card>
    <Card draggable={true} padding={1} modal="selectedCell">
      <SelectedCell />
    </Card>

    <Card draggable={true} padding={1} modal="areaDetail">
      <AreaDetail />
    </Card>
    {#if $tileSelection?.active}
      <Card draggable={true} padding={1}>
        <TileSelectionModal />
      </Card>{/if}
    {#if $game.areas.length == 0}
      <Card draggable={false} padding={1}>
        <StartingArea />
      </Card>
    {/if}
  </Modal>
  <div class="overlay">
    <Card>
      <Time /></Card>
    <Card>
      <Collapsible
        headerName="Population"
        headerType={2}
        hidden={true}
        modal="population">
        <Population />
      </Collapsible>
    </Card>
    <Card>
      <Collapsible headerName="Supplies" headerType={2} hidden={true}>
        <Supplies />
      </Collapsible>
    </Card>
    <Card>
      <Collapsible headerName="Areas" headerType={2} hidden={true}>
        <Areas />
      </Collapsible>
    </Card>
    <Card>
      <Collapsible headerName="Log" headerType={2} hidden={true}>
        <Logs />
      </Collapsible>
    </Card>
    <Card>
      <Debug />
    </Card>
  </div>
  <div><Map /></div>
</div>

<style>
  .game-container {
    height: 100vh;
    width: 100vw;
  }
  .overlay {
    position: absolute;
    height: 100vh;
    max-width: 100vw;
    width: min-content;
    display: flex;
    flex-wrap: wrap;
    flex-direction: column;
    padding: 1rem;
    gap: 0.5rem;
  }
</style>
