import type { EncyclopediaPage } from "./types";
import { indexPage } from "./index";
import { villagePage } from "./village";
import { buildingsPage } from "./buildings";
import { populationPage } from "./population";
import { resourcesPage } from "./resources";
import { farmingPage } from "./farming";
import { industryPage } from "./industry";
import { tradePage } from "./trade";

// Special pages that are dynamically rendered
export const specialPages = ["building-list", "item-list", "animal-list"];

export const encyclopediaPages: Record<string, EncyclopediaPage> = {
  index: indexPage,
  village: villagePage,
  buildings: buildingsPage,
  population: populationPage,
  resources: resourcesPage,
  farming: farmingPage,
  industry: industryPage,
  trade: tradePage,
};
