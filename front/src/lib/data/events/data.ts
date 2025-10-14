import { arrayToObject } from "$lib/util/arrayToObject";
import { type EventContainer } from "../events";
import { event_CreaturesOfTheForest } from "./creaturesOfTheForest";
//import { event_AlchemicalObsession } from "./alchemicalObsession";
//import { genericEvents } from "./genericEvents";

export const eventData = [
  //event_CreaturesOfTheForest,
  //event_AlchemicalObsession, // Triggered by lord goal, not by time
  //...genericEvents,
] as const satisfies EventContainer[];
export type EventIDs = (typeof eventData)[number]["id"];
export const eventMap = arrayToObject(eventData);
