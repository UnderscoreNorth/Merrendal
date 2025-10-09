import type {
  Building,
  BuildingTemplate,
  BuildingType,
} from "../data/buildings";
import { buildingTypes } from "../data/buildings";
import { type GameState } from "$lib/stores";
import { type Area } from "$lib/data/areas";

export function spawnBuilding(
  area: Area,
  buildingType: BuildingType,
  building: BuildingTemplate,
) {
  const newBuilding: Building = {
    id: buildingType,
    type: buildingType,
    maxPops: 0,
    occupationTitle: building.occupationTitle,
    status: "Built",
    workers: new Set(),
  };
  const buildingTemplate = buildingTypes[buildingType];
  if (typeof buildingTemplate.maxPops == "number") {
    newBuilding.maxPops = buildingTemplate.maxPops;
  } else {
    newBuilding.maxPops = buildingTemplate.maxPops(area);
  }
  area.buildings.push(newBuilding);
}
export function getAllBuildings(gs: GameState) {
  return Object.values(gs.areas)
    .map((i) => i.buildings)
    .flat();
}
