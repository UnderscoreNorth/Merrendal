import type { GameState } from "$lib/stores";
import type { Animal, AnimalType } from "$lib/data/living";
import { animalType } from "$lib/data/animals";
import { buildingTypes } from "$lib/data/buildings";
import { v4 as uuidv4 } from "uuid";
import { rollRange } from "$lib/util/rolls";

/**
 * Assign an animal to a pasture
 */
export function assignAnimalToPasture(
  gs: GameState,
  animalId: string,
  pastureId: string,
): void {
  const animal = gs.animals.find((a) => a.id === animalId);
  if (animal) {
    animal.pasture = pastureId;
  }
}

/**
 * Unassign an animal from its pasture
 */
export function unassignAnimal(gs: GameState, animalId: string): void {
  const animal = gs.animals.find((a) => a.id === animalId);
  if (animal) {
    animal.pasture = "";
  }
}

/**
 * Slaughter an animal and add meat/hides to inventory
 * Can be called for old age death or manual slaughter
 */
export function slaughterAnimal(gs: GameState, animalId: string): void {
  const animalIndex = gs.animals.findIndex((a) => a.id === animalId);
  if (animalIndex === -1) return;

  const animal = gs.animals[animalIndex];
  const animalData = animalType[animal.animalType];

  // Determine if adult based on maturity age
  const isAdult = animal.age >= animalData.maturity;

  // Add meat to inventory
  const meatAmount = isAdult ? animalData.adultMeat : animalData.initialMeat;
  if (meatAmount > 0) {
    gs.inventory.Meat = (gs.inventory.Meat ?? 0) + meatAmount;
  }

  // Add hide to inventory
  const hideAmount = isAdult ? animalData.adultHide : animalData.initialHide;
  if (hideAmount > 0) {
    gs.inventory["Animal Hides"] =
      (gs.inventory["Animal Hides"] ?? 0) + hideAmount;
  }

  // Remove animal from array (don't track dead animals)
  gs.animals.splice(animalIndex, 1);

  gs.log.push({
    year: gs.currentYear,
    day: gs.currentDay,
    msg: `${animal.animalType} slaughtered (${meatAmount} lbs meat, ${hideAmount} lbs hide)`,
    tags: ["animals", "slaughter"],
  });
}

/**
 * Calculate total pasture space available from Pasture buildings
 * Each Pasture building provides capacity equal to its total size (base + expansions)
 * The "Expand Pasture" upgrade increases the building's size in buildingLand
 */
function getAvailablePasture(gs: GameState): number {
  let totalPasture = 0;

  for (const area of Object.values(gs.areas)) {
    // Count pasture from Pasture buildings
    const pastureBuildings = area.buildings.filter(
      (b) => b.buildingType === "Pasture" && b.status === "built",
    );

    for (const building of pastureBuildings) {
      // Base pasture size
      let pastureSize = buildingTypes.Pasture.size;

      // Add size from "Expand Pasture" upgrades that are built
      const expandUpgrade = building.upgrades["Expand Pasture"];
      if (expandUpgrade?.status === "built") {
        const upgradeData = buildingTypes.Pasture.upgrades["Expand Pasture"];
        if (upgradeData?.size) {
          pastureSize += upgradeData.size;
        }
      }

      totalPasture += pastureSize;
    }
  }

  return totalPasture;
}

/**
 * Process old age deaths for animals
 * Death chance scales up much faster than humans once past lifespan
 */
export function processAnimalOldAgeDeaths(gs: GameState): void {
  const animalsToSlaughter: string[] = [];

  for (const animal of gs.animals) {
    const animalData = animalType[animal.animalType];

    // Check if animal is past lifespan
    if (animal.age > animalData.lifeSpan) {
      const yearsOver = animal.age - animalData.lifeSpan;
      // Much steeper death chance than humans: 50% at lifespan, increases by 25% per year
      const deathChance = 0.5 + yearsOver * 0.25;

      if (Math.random() < deathChance) {
        animalsToSlaughter.push(animal.id);
      }
    }
  }

  // Slaughter animals that died of old age
  for (const animalId of animalsToSlaughter) {
    const animal = gs.animals.find((a) => a.id === animalId);
    if (animal) {
      gs.log.push({
        year: gs.currentYear,
        day: gs.currentDay,
        msg: `${animal.animalType} died of old age (${animal.age} years)`,
        tags: ["animals", "death"],
      });
      slaughterAnimal(gs, animalId);
    }
  }
}

/**
 * Calculate how much pasture space is currently used by animals
 */
function getUsedPasture(gs: GameState): number {
  let usedSpace = 0;
  for (const animal of gs.animals) {
    const animalData = animalType[animal.animalType];
    usedSpace += animalData.acresPer;
  }
  return usedSpace;
}

/**
 * Check if there's enough space for a new animal of the given type
 */
function hasSpaceForAnimal(gs: GameState, animalSpecies: AnimalType): boolean {
  const availablePasture = getAvailablePasture(gs);
  const usedPasture = getUsedPasture(gs);
  const requiredSpace = animalType[animalSpecies].acresPer;
  return availablePasture - usedPasture >= requiredSpace;
}

/**
 * Process animal breeding - called once per year
 * Requires: 2+ mature animals in same pasture, and a worker assigned to that pasture
 */
export function processAnimalBreeding(gs: GameState): void {
  // Get all pasture buildings
  for (const area of Object.values(gs.areas)) {
    for (const building of area.buildings) {
      if (building.buildingType !== "Pasture" || building.status !== "built")
        continue;

      // Check if pasture has a worker
      if (building.workers.length === 0) continue;

      // Get animals in this pasture, grouped by species
      const animalsInPasture = gs.animals.filter(
        (a) => a.pasture === building.id,
      );
      const speciesMap = new Map<AnimalType, Animal[]>();

      for (const animal of animalsInPasture) {
        if (!speciesMap.has(animal.animalType)) {
          speciesMap.set(animal.animalType, []);
        }
        speciesMap.get(animal.animalType)!.push(animal);
      }

      // Process breeding for each species in this pasture
      for (const [species, animals] of speciesMap) {
        const animalData = animalType[species];

        // Count mature animals of this species in this pasture
        const matureAnimals = animals.filter(
          (a) => a.age >= animalData.maturity,
        );
        const matureCount = matureAnimals.length;

        // Need at least 2 mature animals to breed
        if (matureCount < 2) continue;

        // Calculate number of breeding pairs
        const breedingPairs = Math.floor(matureCount / 2);

        // Each pair can produce offspring based on birth rate
        const potentialOffspring = breedingPairs * animalData.birthRate;

        // Try to add each offspring if there's space
        for (let i = 0; i < potentialOffspring; i++) {
          if (hasSpaceForAnimal(gs, species)) {
            const newAnimal: Animal = {
              id: uuidv4(),
              type: "Animal",
              animalType: species,
              age: 0,
              birthday: rollRange(1, 365),
              status: [],
              pasture: building.id, // Assign to same pasture as parents
            };
            gs.animals.push(newAnimal);

            gs.log.push({
              year: gs.currentYear,
              day: gs.currentDay,
              msg: `A ${species.toLowerCase()} was born in pasture!`,
              tags: ["animals", "birth"],
            });
          } else {
            // Not enough pasture space
            gs.log.push({
              year: gs.currentYear,
              day: gs.currentDay,
              msg: `Not enough pasture space for ${species.toLowerCase()} to breed.`,
              tags: ["animals", "warning"],
            });
            break; // Stop trying to add more of this species
          }
        }
      }
    }
  }
}
