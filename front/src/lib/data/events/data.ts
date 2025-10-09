import { arrayToObject } from "$lib/util/arrayToObject";
import { type EventContainer } from "../events";
import { event_CreaturesOfTheForest } from "./creaturesOfTheForest";
import { genericEvents } from "./genericEvents";

export const eventData = [
  event_CreaturesOfTheForest,
  ...genericEvents,
] as const satisfies EventContainer[];
export type EventIDs = (typeof eventData)[number]["id"];
export const eventMap = arrayToObject(eventData);
