<script lang="ts">
  import { onMount, onDestroy } from "svelte";
  import { openModals } from "$lib/stores";
  import { encyclopediaPages, specialPages } from "$lib/data/encyclopedia/pages";
  import type { EncyclopediaContent } from "$lib/data/encyclopedia/types";
  import WikiLink from "$lib/ui/Components/WikiLink.svelte";
  import { buildingTypes } from "$lib/data/buildings";
  import { items, type ItemName } from "$lib/data/items";
  import { animalType } from "$lib/data/animals";

  export let page = "index";
  export let id: number;

  let currentPage = page || "index";
  let history: string[] = [];

  // Listen for navigation events from WikiLink components
  function handleNavigate(event: CustomEvent<{ page: string }>) {
    history = [...history, currentPage];
    currentPage = event.detail.page;
  }

  function goBack() {
    if (history.length > 0) {
      const previousPage = history[history.length - 1];
      history = history.slice(0, -1);
      currentPage = previousPage;
    }
  }

  function goHome() {
    if (currentPage !== "index") {
      history = [...history, currentPage];
      currentPage = "index";
    }
  }

  function closeWindow() {
    // Find and remove this encyclopedia window from openModals
    if ($openModals.Encyclopedia) {
      const entries = Object.entries($openModals.Encyclopedia);
      for (const [key, value] of entries) {
        if ((value as any).id === id) {
          delete $openModals.Encyclopedia[key];
          $openModals = $openModals;
          break;
        }
      }
    }
  }

  // Render a content item
  function renderContent(item: EncyclopediaContent): any {
    return item;
  }

  // Group items by category for item list
  function getItemsByCategory() {
    const categories: Record<string, ItemName[]> = {};
    Object.entries(items).forEach(([itemName, itemData]) => {
      itemData.category.forEach((cat) => {
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push(itemName as ItemName);
      });
    });
    return categories;
  }

  onMount(() => {
    document.addEventListener("navigate", handleNavigate as EventListener);
  });

  onDestroy(() => {
    document.removeEventListener("navigate", handleNavigate as EventListener);
  });

  $: pageData = encyclopediaPages[currentPage];
  $: pageTitle = pageData?.title || "Encyclopedia";
  $: isSpecialPage = specialPages.includes(currentPage);
</script>

<div class="encyclopedia">
  <div class="header">
    <div class="title-bar">
      <h2>{pageTitle}</h2>
      <button class="close-btn" on:click={closeWindow}>×</button>
    </div>
    <div class="navigation">
      <button on:click={goHome} disabled={currentPage === "index"}>Home</button>
      <button on:click={goBack} disabled={history.length === 0}>Back</button>
    </div>
  </div>

  <div class="content">
    {#if isSpecialPage}
      <!-- Special dynamic pages -->
      {#if currentPage === "building-list"}
        <h2>Building Reference</h2>
        <p>
          This page lists all available buildings. Each building has specific
          requirements, worker capacity, and maintenance needs.
        </p>
        {#each Object.entries(buildingTypes) as [buildingType, template]}
          <div class="list-item">
            <h3>{buildingType}</h3>
            <p><strong>Category:</strong> {template.category}</p>
            <p><strong>Max Workers:</strong> {template.maxPops}</p>
            {#if "occupationTitle" in template}
              <p><strong>Occupation:</strong> {template.occupationTitle}</p>
            {/if}
            <p>
              <strong>Requirements:</strong>
              {Object.entries(template.requirements)
                .map(([item, qty]) => `${qty} ${item}`)
                .join(", ")}
            </p>
            {#if "maintenance" in template && template.maintenance}
              <p>
                <strong>Maintenance:</strong>
                {Object.entries(template.maintenance.cost)
                  .map(([item, qty]) => `${qty} ${item}`)
                  .join(", ")}
              </p>
            {/if}
          </div>
        {/each}
      {:else if currentPage === "item-list"}
        <h2>Item Reference</h2>
        <p>
          This page lists all items and resources in the game, organized by
          category.
        </p>
        {#each Object.entries(getItemsByCategory()) as [category, itemList]}
          <div class="category-section">
            <h3>{category}</h3>
            <ul>
              {#each itemList as itemName}
                <li>
                  <strong>{itemName}</strong> - {items[itemName].unit}
                </li>
              {/each}
            </ul>
          </div>
        {/each}
      {:else if currentPage === "animal-list"}
        <h2>Animal Reference</h2>
        <p>
          This page lists all animals that can be raised in your village,
          including their requirements and yields.
        </p>
        {#each Object.entries(animalType) as [animal, data]}
          <div class="list-item">
            <h3>{animal}</h3>
            <p><strong>Acres per animal:</strong> {data.acresPer}</p>
            <p><strong>Initial meat:</strong> {data.initialMeat} Lb</p>
            <p><strong>Adult meat:</strong> {data.adultMeat} Lb</p>
            <p><strong>Initial hide:</strong> {data.initialHide}</p>
            <p><strong>Adult hide:</strong> {data.adultHide}</p>
            <p><strong>Maturity:</strong> {data.maturity} years</p>
            <p><strong>Birth rate:</strong> {data.birthRate}</p>
            <p><strong>Lifespan:</strong> {data.lifeSpan} years</p>
          </div>
        {/each}
      {/if}
    {:else if pageData}
      <!-- Regular pages from TypeScript data -->
      {#each pageData.content as item}
        {#if item.type === "text"}
          <p>{item.content}</p>
        {:else if item.type === "heading"}
          {#if item.level === 2}
            <h2>{item.content}</h2>
          {:else if item.level === 3}
            <h3>{item.content}</h3>
          {/if}
        {:else if item.type === "list"}
          <ul>
            {#each item.items || [] as listItem}
              <li>
                {#if listItem.type === "link"}
                  <WikiLink to={listItem.to || ""}>{listItem.content}</WikiLink
                  >
                {:else}
                  {listItem.content}
                {/if}
              </li>
            {/each}
          </ul>
        {/if}
      {/each}
    {:else}
      <p>Page not found.</p>
    {/if}
  </div>
</div>

<style>
  .encyclopedia {
    min-width: 500px;
    max-width: 700px;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    color: #e0e0e0;
  }

  .header {
    border-bottom: 1px solid #555;
    padding-bottom: 0.5rem;
    margin-bottom: 1rem;
  }

  .title-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.5rem;
  }

  h2 {
    margin: 0 0 1rem 0;
    color: gold;
    font-size: 1.5rem;
  }

  h3 {
    color: gold;
    margin-top: 0;
    margin-bottom: 0.5rem;
    font-size: 1.2rem;
  }

  p {
    margin: 0.5rem 0;
    line-height: 1.6;
  }

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
    line-height: 1.8;
  }

  li {
    margin: 0.25rem 0;
  }

  .close-btn {
    background: none;
    border: 1px solid #555;
    color: #e0e0e0;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0 0.5rem;
    line-height: 1;
    border-radius: 3px;
  }

  .close-btn:hover {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .navigation {
    display: flex;
    gap: 0.5rem;
    align-items: center;
  }

  .navigation button {
    background: none;
    border: 1px solid #555;
    color: #e0e0e0;
    padding: 0.25rem 0.75rem;
    cursor: pointer;
    border-radius: 3px;
  }

  .navigation button:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.1);
    color: #fff;
  }

  .navigation button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .content {
    overflow-y: auto;
    flex: 1;
  }

  .list-item {
    border: 1px solid #555;
    padding: 1rem;
    margin-bottom: 1rem;
    border-radius: 4px;
    background: rgba(0, 0, 0, 0.2);
  }

  .list-item h3 {
    margin-top: 0;
  }

  .list-item p {
    margin: 0.25rem 0;
  }

  .category-section {
    margin-bottom: 1.5rem;
  }

  .category-section h3 {
    border-bottom: 1px solid #555;
    padding-bottom: 0.25rem;
  }
</style>
