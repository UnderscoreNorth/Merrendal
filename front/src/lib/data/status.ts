import { type ItemName } from "./items";

export type Status = {
  name: string;
  duration: number;
  modifiers: Array<StatModifier>;
  status: "Active" | "Removing";
  removalConditions: {
    items: Partial<Record<ItemName, number>>;
    time: number;
  };
};
export type StatModifier = {
  type: "statModifier";
  stat: "str" | "dex";
  modifier: number;
};
