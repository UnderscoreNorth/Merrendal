import type { GameState } from "$lib/stores";
import type { ChoiceEvent } from "./choices";

export type SubEvent = {
  id: string;
  title: string;
  desc: string;
  completed: boolean;
  visible: boolean; // Whether this subevent is visible to the player
  inProgress?: boolean; // Track if the subevent action (e.g., project) is in progress
  projectKey?: string; // Key to identify the associated project in currentProjects
  createChoiceEvent: (parentEvent: Event) => ChoiceEvent;
};

export type EventPhase = {
  id: string;
  name: string;
  desc: string;
  [key: string]: any; // Allow additional custom properties for tracking
};

export class Event {
  id: string;
  target: "NPC" | "Building" | "Area";
  action: (arg: { gs?: GameState }) => void;
  resolved: (arg: { gs?: GameState }) => boolean;
  desc = "";
  phase: EventPhase;
  subEvents: SubEvent[];
  constructor(id: string) {
    this.id = id;
    this.target = "Area";
    this.action = () => {};
    this.resolved = () => true;
    this.phase = { id: "initial", name: "Initial", desc: "" };
    this.subEvents = [];
  }
}
export type EventCondition = {
  type: "Time";
  mtth: number;
};

export type EventContainer = {
  id: string;
  condition: EventCondition;
  multiple: boolean;
  event: new (...args: any[]) => Event;
};
