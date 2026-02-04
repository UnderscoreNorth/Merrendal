import type { ItemName } from "./items";

/**
 * Event system for displaying narrative events with choices
 */

export type EventRequirementType = "item" | "villager_count" | "village_stat";

export type EventRequirement = {
  type: "item";
  item: ItemName;
  amount: number;
  consumed: boolean; // If true, requirement consumes the items/villagers
} | {
  type: "villager_count";
  amount: number;
  consumed: boolean; // If true, kills/removes villagers
} | {
  type: "village_stat";
  stat: "trust" | "authority" | "stability";
  minValue?: number;
  maxValue?: number;
};

export type EventEffectType =
  | "add_item"
  | "remove_item"
  | "modify_village_stat"
  | "create_event"
  | "add_villager"
  | "remove_villager"
  | "log_message";

export type EventEffect = {
  type: "add_item";
  item: ItemName;
  amount: number;
} | {
  type: "remove_item";
  item: ItemName;
  amount: number;
} | {
  type: "modify_village_stat";
  stat: "trust" | "authority" | "stability";
  amount: number; // Can be positive or negative
} | {
  type: "create_event";
  eventId: string;
  delay?: number; // Delay in days before event triggers (0 = immediate)
} | {
  type: "add_villager";
  count: number;
} | {
  type: "remove_villager";
  count: number;
} | {
  type: "log_message";
  message: string;
  tags?: string[];
};

export type EventChoice = {
  id: string;
  text: string;
  description?: string;
  requirements?: EventRequirement[];
  effects?: EventEffect[];
  enabled?: boolean; // Computed at runtime based on requirements
};

export type GameEvent = {
  id: string;
  title: string;
  description: string;
  choices: EventChoice[];
  createdAt?: {
    year: number;
    day: number;
  };
  triggerAt?: {
    year: number;
    day: number;
  };
  imageUrl?: string; // Optional image for the event
};

export type ActiveEvent = {
  event: GameEvent;
  addedAt: {
    year: number;
    day: number;
  };
};

/**
 * Event definitions - these are the template events that can be instantiated
 */
export const eventDefinitions: Record<string, Omit<GameEvent, "id">> = {
  welcome_to_merrendal: {
    title: "The Lands of Merrendal",
    description: `The old maps call this place Merrendal, though no one remembers why. Your party has traveled for weeks through the wilderness, seeking refuge from the wars that have torn the eastern kingdoms apart.

As you crest the final hill, you see it: a fertile valley nestled between protective mountains, with a river winding through virgin forests. The land is empty, wild, and full of promise.

Your people look to you for guidance. What kind of settlement will you build here?`,
    choices: [
      {
        id: "continue",
        text: "Continue",
        description: "Learn more about your situation",
        effects: [
          {
            type: "create_event",
            eventId: "settlement_choice",
          }
        ]
      }
    ]
  },

  settlement_choice: {
    title: "Founding Principles",
    description: `Your followers number fewer than fifty souls - farmers, craftsmen, a handful of former soldiers. You have limited supplies and winter will come eventually.

Before you can begin building, you must decide what kind of community this will be. The choices you make now will shape Merrendal's future.`,
    choices: [
      {
        id: "democratic",
        text: "A Free Settlement",
        description: "Establish a council where all voices are heard equally",
        effects: [
          {
            type: "modify_village_stat",
            stat: "trust",
            amount: 20
          },
          {
            type: "modify_village_stat",
            stat: "authority",
            amount: -10
          },
          {
            type: "log_message",
            message: "You established a democratic council. The people trust you, but organizing efforts will be challenging.",
            tags: ["governance", "founding"]
          },
          {
            type: "create_event",
            eventId: "first_priorities",
          }
        ]
      },
      {
        id: "authoritarian",
        text: "A Structured Hierarchy",
        description: "Establish clear authority and chain of command",
        effects: [
          {
            type: "modify_village_stat",
            stat: "authority",
            amount: 20
          },
          {
            type: "modify_village_stat",
            stat: "trust",
            amount: -10
          },
          {
            type: "log_message",
            message: "You established a clear hierarchy. Orders will be followed, but some grumble about the loss of freedom.",
            tags: ["governance", "founding"]
          },
          {
            type: "create_event",
            eventId: "first_priorities",
          }
        ]
      },
      {
        id: "balanced",
        text: "A Balanced Approach",
        description: "Establish leadership while respecting community input",
        effects: [
          {
            type: "modify_village_stat",
            stat: "trust",
            amount: 5
          },
          {
            type: "modify_village_stat",
            stat: "authority",
            amount: 5
          },
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: 10
          },
          {
            type: "log_message",
            message: "You established a balanced system of governance. The compromise seems to satisfy most people.",
            tags: ["governance", "founding"]
          },
          {
            type: "create_event",
            eventId: "first_priorities",
          }
        ]
      }
    ]
  },

  first_priorities: {
    title: "First Priorities",
    description: `With governance settled, you must now focus on survival. Your supplies are limited, and you need to establish the basics quickly.

The former soldiers suggest building defenses first - you don't know what dangers lurk in these lands. The farmers want to begin planting immediately while the season allows. The craftsmen argue for building proper shelters before winter comes.

All three are important, but you can only focus the community's efforts on one task at a time.`,
    choices: [
      {
        id: "defenses",
        text: "Build Defenses",
        description: "Safety first - construct palisades and watch posts",
        effects: [
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: 15
          },
          {
            type: "log_message",
            message: "You ordered the construction of defensive palisades. The people feel safer, but worry about food stores.",
            tags: ["defense", "priorities"]
          },
          {
            type: "create_event",
            eventId: "mysterious_stranger",
            delay: 3
          }
        ]
      },
      {
        id: "farming",
        text: "Start Farming",
        description: "Clear land and plant crops immediately",
        effects: [
          {
            type: "add_item",
            item: "Grain",
            amount: 10
          },
          {
            type: "log_message",
            message: "You ordered immediate planting. The farmers are optimistic about the harvest.",
            tags: ["farming", "priorities"]
          },
          {
            type: "create_event",
            eventId: "mysterious_stranger",
            delay: 3
          }
        ]
      },
      {
        id: "shelters",
        text: "Build Shelters",
        description: "Construct proper housing for winter",
        effects: [
          {
            type: "modify_village_stat",
            stat: "trust",
            amount: 10
          },
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: 5
          },
          {
            type: "log_message",
            message: "You prioritized building comfortable shelters. The people appreciate your concern for their wellbeing.",
            tags: ["construction", "priorities"]
          },
          {
            type: "create_event",
            eventId: "mysterious_stranger",
            delay: 3
          }
        ]
      }
    ]
  },

  mysterious_stranger: {
    title: "The Mysterious Stranger",
    description: `Three days after establishing your priorities, a lone traveler appears at the edge of your settlement. He wears a worn gray cloak and carries no visible weapons.

"I am called Eldrin," he says. "I knew these lands long ago, before the old kingdom fell. I can teach you much about Merrendal's secrets - the hidden resources, the safe paths through the mountains, the places to avoid."

He pauses, studying your reaction. "But knowledge has value. I would ask for a place in your community, and a share of your supplies."

Some of your people seem suspicious of this convenient stranger. Others are intrigued by his promises.`,
    choices: [
      {
        id: "accept",
        text: "Welcome Him",
        description: "Accept Eldrin into the community",
        requirements: [
          {
            type: "item",
            item: "Grain",
            amount: 5,
            consumed: true
          }
        ],
        effects: [
          {
            type: "add_villager",
            count: 1
          },
          {
            type: "modify_village_stat",
            stat: "trust",
            amount: -5
          },
          {
            type: "log_message",
            message: "Eldrin joined your settlement. Some are wary, but his knowledge may prove valuable.",
            tags: ["stranger", "recruitment"]
          },
          {
            type: "create_event",
            eventId: "eldrin_knowledge",
            delay: 5
          }
        ]
      },
      {
        id: "refuse_politely",
        text: "Politely Decline",
        description: "Thank him but explain you cannot spare resources",
        effects: [
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: 5
          },
          {
            type: "log_message",
            message: "You politely refused Eldrin's offer. He nodded knowingly and disappeared into the forest.",
            tags: ["stranger", "refused"]
          }
        ]
      },
      {
        id: "trade_knowledge",
        text: "Trade for Knowledge",
        description: "Offer to trade for specific information without permanent commitment",
        requirements: [
          {
            type: "item",
            item: "Grain",
            amount: 2,
            consumed: true
          }
        ],
        effects: [
          {
            type: "modify_village_stat",
            stat: "authority",
            amount: 5
          },
          {
            type: "log_message",
            message: "Eldrin shared some knowledge about the valley in exchange for supplies, then continued on his way.",
            tags: ["stranger", "trade"]
          }
        ]
      }
    ]
  },

  eldrin_knowledge: {
    title: "Eldrin's Secret",
    description: `Over the past few days, Eldrin has proven himself useful, helping identify edible plants and warning of dangerous areas. Tonight, he approaches you privately.

"There is something you should know," he says quietly. "The ruins to the north - they were once part of the old Merrendal kingdom. Within them lies a cache of supplies and tools left by my people before we fled."

He looks troubled. "But the ruins are not unoccupied. Strange creatures nest there now - not natural beasts. We would need brave souls willing to face danger for reward."`,
    choices: [
      {
        id: "organize_expedition",
        text: "Organize an Expedition",
        description: "Prepare a group to explore the ruins",
        requirements: [
          {
            type: "villager_count",
            amount: 10,
            consumed: false
          }
        ],
        effects: [
          {
            type: "log_message",
            message: "You began planning an expedition to the ancient ruins.",
            tags: ["exploration", "ruins"]
          },
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: -10
          }
        ]
      },
      {
        id: "wait",
        text: "Wait for Better Timing",
        description: "The settlement isn't ready for such risks yet",
        effects: [
          {
            type: "modify_village_stat",
            stat: "stability",
            amount: 5
          },
          {
            type: "log_message",
            message: "You decided to wait until the settlement is more established before exploring dangerous ruins.",
            tags: ["exploration", "caution"]
          }
        ]
      }
    ]
  }
};

/**
 * Create an event instance from a definition
 */
export function createEvent(
  eventId: string,
  currentYear: number,
  currentDay: number,
  triggerDelay: number = 0
): GameEvent {
  const definition = eventDefinitions[eventId];
  if (!definition) {
    throw new Error(`Event definition not found: ${eventId}`);
  }

  return {
    id: eventId,
    ...definition,
    createdAt: {
      year: currentYear,
      day: currentDay
    },
    triggerAt: triggerDelay > 0 ? {
      year: currentYear,
      day: currentDay + triggerDelay
    } : undefined
  };
}
