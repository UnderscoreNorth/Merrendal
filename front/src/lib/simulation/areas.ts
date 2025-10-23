import { type Area } from "$lib/data/areas";
import { buildingTypes } from "$lib/data/buildings";
import { recordLoop } from "$lib/util/recordLoop";

export function getUsedSpace(area: Area) {
  let totalSize = 0;

  // Add sizes from built upgrades
  for (const building of area.buildings) {
    const buildingTemplate = buildingTypes[building.buildingType];
    totalSize += buildingTemplate.size;
    for (const [upgradeName, upgradeStatus] of recordLoop(building.upgrades)) {
      if (upgradeStatus.status === "built") {
        //@ts-ignore
        const upgradeData = buildingTemplate.upgrades[upgradeName];
        if (upgradeData && upgradeData.size) {
          totalSize += upgradeData.size;
        }
      }
    }
  }

  // Add sizes from in-progress upgrades
  for (const project of area.currentProjects) {
    if (project.type === "upgrade") {
      const buildingTemplate = buildingTypes[project.building.buildingType];
      //@ts-ignore
      const upgradeData = buildingTemplate.upgrades[project.upgrade];
      if (upgradeData && upgradeData.size) {
        totalSize += upgradeData.size;
      }
    }
  }

  return totalSize;
}
