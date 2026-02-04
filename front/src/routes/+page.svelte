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
  import AreaDetail from "$lib/ui/Modals/AreaDetail.svelte";
  import TileSelectionModal from "$lib/ui/Modals/TileSelectionModal.svelte";
  import Debug from "$lib/ui/Cards/Debug.svelte";
  import Projects from "$lib/ui/Cards/Projects.svelte";
  import Kingdom from "$lib/ui/Cards/Kingdom.svelte";
  import MainHeader from "$lib/ui/MainHeader.svelte";
  import EventCard from "$lib/ui/Cards/EventCard.svelte";
  import { getNextEvent } from "$lib/systems/eventSystem";
  import Encyclopedia from "$lib/ui/Modals/Encyclopedia/Encyclopedia.svelte";

  // Load from localStorage if available, otherwise initialize new game
  const loaded = loadGame();
  if (!loaded) {
    init();
  }

  // Get the next active event that should be displayed
  $: currentEvent = getNextEvent();
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

    <Card draggable={true} padding={1} modal="areaDetail">
      <AreaDetail />
    </Card>
    {#if $tileSelection?.active}
      <Card draggable={true} padding={1}>
        <TileSelectionModal />
      </Card>{/if}
    {#if $game.activeEvents.length}
      <Card draggable={true} padding={1}>
        <EventCard event={$game.activeEvents[0].event} /></Card>
    {/if}
    {#if $openModals.Encyclopedia}
      {#each Object.values($openModals.Encyclopedia) as page}
        <Card draggable={true} padding={1}>
          <Encyclopedia id={page.id} page={page.page} />
        </Card>
      {/each}
    {/if}
  </Modal>
  <div class="overlay">
    <Card>
      <Time /></Card>
    <Card><Kingdom /></Card>
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
      <Collapsible headerName="Projects" headerType={2} hidden={true}>
        <Projects />
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
  {#key $game.seed}
    <div><Map /></div>
  {/key}

  <!-- Event System -->
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
