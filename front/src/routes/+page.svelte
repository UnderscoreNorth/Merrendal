<script lang="ts">
  import "./styles.css";
  import { init } from "$lib/init";
  import { game, mouseCood, openModals } from "$lib/stores";
  import Collapsible from "$lib/ui/Collapsible.svelte";
  import LordSelection from "$lib/ui/Modals/LordSelection.svelte";
  import Areas from "$lib/ui/Cards/Areas.svelte";
  import Logs from "$lib/ui/Cards/Logs.svelte";
  import Map from "$lib/ui/Map.svelte";
  import Time from "$lib/ui/Cards/Time.svelte";
  import Population from "$lib/ui/Cards/Population.svelte";
  import Supplies from "$lib/ui/Cards/Supplies.svelte";
  import Lord from "$lib/ui/Cards/Lord.svelte";
  import Card from "$lib/ui/Cards/Card.svelte";
  import Needs from "$lib/ui/Cards/Needs.svelte";
  import Modal from "$lib/ui/Modals/Modal.svelte";
  import ChoiceEvent from "$lib/ui/Modals/ChoiceEvent.svelte";
  import PastLords from "$lib/ui/Modals/PastLords.svelte";
  import Events from "$lib/ui/Cards/Events.svelte";
  import AddNeedModal from "$lib/ui/Modals/AddNeedModal.svelte";
  import EventDetail from "$lib/ui/Modals/EventDetail.svelte";
  import PopulationModal from "$lib/ui/Modals/PopulationModal.svelte";
  import AreaDetail from "$lib/ui/Modals/AreaDetail.svelte";
  init();
</script>

<svelte:head><title>Legacy of Merrendal</title></svelte:head>

<svelte:window
  on:mousemove={(e) => {
    $mouseCood = { x: e.clientX, y: e.clientY };
  }}
/>
<div class="game-container">
  <Modal>
    {#if !$game.lord}
      <Card draggable={true} padding={1}>
        <LordSelection />
      </Card>
    {/if}
    {#if $game.choiceEvents.length}
      <Card draggable={true} padding={1}>
        <ChoiceEvent />
      </Card>
    {/if}
    <Card draggable={true} padding={1} modal="pastLords">
      <PastLords />
    </Card>
    <Card draggable={true} padding={1} modal="addNeeds">
      <AddNeedModal />
    </Card>
    {#if $openModals["eventDetail"] !== undefined}
      <Card draggable={true} padding={1} modal="eventDetail">
        <EventDetail />
      </Card>
    {/if}
    <Card draggable={true} padding={1} modal="population">
      <PopulationModal />
    </Card>
    {#if $openModals["areaDetail"] !== undefined}
      <Card draggable={true} padding={1} modal="areaDetail">
        <AreaDetail area={$openModals["areaDetail"]} />
      </Card>
    {/if}
  </Modal>
  <div class="overlay">
    {#if $game.lord}
      <Card>
        <Lord /></Card
      >
    {/if}
    <Card>
      <Time /></Card
    >
    <Card>
      <Collapsible
        headerName="Population"
        headerType={2}
        hidden={true}
        modal="population"
      >
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
      <Collapsible headerName="Events" headerType={2} hidden={true}>
        <Events />
      </Collapsible>
    </Card>
    <Card>
      <Collapsible headerName="Needs" headerType={2} hidden={true}>
        <Needs />
      </Collapsible>
    </Card>
    <Card>
      <Collapsible headerName="Log" headerType={2} hidden={true}>
        <Logs />
      </Collapsible>
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
