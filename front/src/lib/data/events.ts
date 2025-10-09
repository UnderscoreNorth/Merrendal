import type { GameState } from "$lib/stores";

export class Event {
  id: string;
  target: "NPC" | "Building" | "Area";
  action: (arg: { gs?: GameState }) => void;
  resolved: (arg: { gs?: GameState }) => boolean;
  desc = "";
  constructor(id: string) {
    this.id = id;
    this.target = "Area";
    this.action = () => {};
    this.resolved = () => true;
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
