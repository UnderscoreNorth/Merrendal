/**
 * Creatures of the Forest Event - V2 (JSON-Serializable)
 *
 * This is a migration of the Creatures of the Forest event to the new
 * JSON-serializable architecture.
 */

import type { EventTemplate, EventData, ChoiceData } from "../events";
import type { GameState } from "$lib/stores";
import type { ProjectData } from "../projects/project";
import { createProjectInstance } from "../projects/project";
import { killLord, killNPC } from "$lib/simulation/mortality";
import { pick } from "$lib/util/rolls";
import { assignNPCs } from "../npcs";
import {
  registerEventActionHandler,
  registerEventResolvedHandler,
  registerChoiceGeneratorHandler,
  registerEffectHandler,
} from "../handlers/registry";

// ===== EVENT TEMPLATE =====

export const creaturesOfTheForestTemplate: EventTemplate = {
  id: "creatures_of_the_forest",
  target: "Area",
  desc: "Something is lurking in the shadows...",
  initialPhase: {
    id: "spotted",
    name: "Creatures Spotted",
    desc: "Something is lurking in the shadows...",
  },
  subEvents: [
    {
      id: "scouting",
      title: "Send Scouts",
      desc: "Send 4 workers into the forest for 3 days to gather information about the creatures.",
      projectKey: "Scouting_COTF",
      choiceGeneratorId: "cotf_scouting_choices",
    },
    {
      id: "preparation",
      title: "Prepare Defenses",
      desc: "Gather 20 spears to prepare for a potential attack.",
      choiceGeneratorId: "cotf_preparation_choices",
    },
    {
      id: "hunting",
      title: "Hunt the Creatures",
      desc: "Organize a hunting party to eliminate the creatures.",
      choiceGeneratorId: "cotf_hunting_choices",
    },
  ],
  actionHandlerId: "cotf_daily_action",
  resolvedHandlerId: "cotf_is_resolved",
  condition: {
    type: "Time",
    mtth: 3,
  },
  multiple: false,
  customData: {
    scoutingCompleted: false,
    preparationCompleted: false,
    huntingCompleted: false,
    deathCount: 0,
    forestWorkRefused: false,
    creatureCount: 0,
    scoutSurvivors: 0,
    lordLeadingScouting: false,
    lordLeadingHunting: false,
    lordScoutingProgress: 0,
    lordHuntingProgress: 0,
  },
};

// ===== HANDLER REGISTRATIONS =====

// Daily action handler
registerEventActionHandler(
  "cotf_daily_action",
  (eventData: EventData, gs: GameState) => {
    const customData = eventData.customData || {};

    // Daily death chance for forest workers
    if (eventData.phase.id !== "resolved" && eventData.phase.id !== "spotted") {
      processDailyForestDeaths(eventData, gs);
    }

    // Check if scouting project has completed
    const scoutingSubEvent = eventData.subEvents.find(
      (se) => se.id === "scouting",
    );
    if (scoutingSubEvent?.inProgress) {
      const scoutingArea = gs.areas.find(
        (a) => a.currentProjects["Scouting_COTF"],
      );
      const lordScoutingArea = gs.areas.find(
        (a) => a.currentProjects["Scouting_COTF_Lord"],
      );

      if (!scoutingArea && !lordScoutingArea) {
        // Project completed - handle scouting results
        if (customData.lordLeadingScouting) {
          handleLordScoutingCompletion(eventData, gs, scoutingSubEvent);
        } else {
          handleScoutingCompletion(eventData, gs, scoutingSubEvent);
        }
      }
    }

    // Check if hunting project has completed
    const huntingSubEvent = eventData.subEvents.find(
      (se) => se.id === "hunting",
    );
    if (huntingSubEvent?.inProgress) {
      const huntingArea = gs.areas.find(
        (a) => a.currentProjects["Hunting_COTF"],
      );
      const lordHuntingArea = gs.areas.find(
        (a) => a.currentProjects["Hunting_COTF_Lord"],
      );

      if (!huntingArea && !lordHuntingArea) {
        // Project completed - handle hunting results
        if (customData.lordLeadingHunting) {
          handleLordHuntingCompletion(eventData, gs, huntingSubEvent);
        } else {
          handleHuntingCompletion(eventData, gs, huntingSubEvent);
        }
      }
    }

    // Check if event is fully resolved
    if (customData.huntingCompleted) {
      eventData.phase = {
        ...eventData.phase,
        id: "resolved",
        name: "Resolved",
        desc: "The creatures have been eliminated.",
      };
    } else if (eventData.phase.id === "spotted") {
      // Initial phase - show the warning
      eventData.phase = {
        ...eventData.phase,
        id: "warned",
        name: "Warned",
        desc: "Villagers are aware of the danger...",
      };
      // Add initial warning choice event
      gs.choiceEvents.push({
        id: "cotf_phase1",
        title: "Creatures spotted!",
        desc: "Villagers have noticed shadows lurking in the shadow",
        choices: () => [
          {
            desc: "Understood. Something will be done",
            effects: () => {},
          },
        ],
      } as any);
    }
  },
);

// Resolved check handler
registerEventResolvedHandler(
  "cotf_is_resolved",
  (eventData: EventData, gs: GameState) => {
    return eventData.phase.id === "resolved";
  },
);

// ===== HELPER FUNCTIONS =====

function processDailyForestDeaths(eventData: EventData, gs: GameState): void {
  const customData = eventData.customData || {};

  // Base death chance per day (0.5%)
  let deathChance = 0.005;

  // If defenses are prepared, reduce death chance significantly (to 0.1%)
  if (customData.preparationCompleted) {
    deathChance = 0.001;
  }

  // Get all workers in forest areas
  const forestAreas = gs.areas.filter((a) => a.type === "Forest");
  const forestWorkers: any[] = [];

  forestAreas.forEach((area) => {
    // Get workers from buildings
    area.buildings.forEach((building) => {
      building.workers.forEach((workerId) => {
        const worker = gs.npcs.find((npc) => npc.id === workerId.toString());
        if (worker) forestWorkers.push(worker);
      });
    });

    // Get workers from projects
    Object.values(area.currentProjects).forEach((project) => {
      project.workers.forEach((workerId) => {
        const worker = gs.npcs.find((npc) => npc.id === workerId.toString());
        if (worker && !forestWorkers.includes(worker)) {
          forestWorkers.push(worker);
        }
      });
    });
  });

  // Roll for deaths
  forestWorkers.forEach((worker) => {
    if (Math.random() < deathChance) {
      killNPC(worker, "Creatures of the Forest", gs);
      customData.deathCount = (customData.deathCount || 0) + 1;

      // Add death notification
      gs.choiceEvents.push({
        id: "cotf_death",
        title: "Villager Lost to Creatures",
        desc: `${worker.fName} was found dead in the forest, torn apart by the creatures...`,
        choices: () => [{ desc: "This is terrible..." }],
      } as any);

      // If 5 or more deaths, villagers refuse to work in forest
      if (customData.deathCount >= 5 && !customData.forestWorkRefused) {
        customData.forestWorkRefused = true;
        gs.choiceEvents.push({
          id: "cotf_work_refusal",
          title: "Villagers Refuse Forest Work",
          desc: "After so many deaths, the villagers are terrified. They refuse to work in the forest until the creatures are eliminated.",
          choices: () => [{ desc: "We must deal with these creatures" }],
        } as any);
      }
    }
  });
}

function handleScoutingCompletion(
  eventData: EventData,
  gs: GameState,
  scoutingSubEvent: any,
): void {
  const customData = eventData.customData || {};

  // Get the scouts that were assigned
  const scoutCount = 4;
  let survivors = scoutCount;

  // Each scout has a 25% chance to die
  for (let i = 0; i < scoutCount; i++) {
    if (Math.random() < 0.25) {
      survivors--;
    }
  }

  // Kill actual NPCs based on survivor count
  const deaths = scoutCount - survivors;
  for (let i = 0; i < deaths; i++) {
    const victim = pick(gs.npcs);
    if (victim) {
      killNPC(victim, "Scouting Creatures", gs);
      customData.deathCount = (customData.deathCount || 0) + 1;
    }
  }

  customData.scoutSurvivors = survivors;

  if (survivors === 0) {
    // All scouts died - can retry scouting
    scoutingSubEvent.completed = false;
    scoutingSubEvent.inProgress = false;
    gs.choiceEvents.push({
      id: "cotf_scouting_failure",
      title: "Scouting Mission Failed",
      desc: "All the scouts perished in the forest. Their screams echoed through the trees... We must try again.",
      choices: () => [{ desc: "May they rest in peace" }],
    } as any);
  } else {
    // At least one survivor - reveal creature count
    scoutingSubEvent.completed = true;
    scoutingSubEvent.inProgress = false;
    customData.scoutingCompleted = true;

    // Random creature count between 3 and 12
    customData.creatureCount = Math.floor(Math.random() * 10) + 3;

    const deathText =
      deaths > 0
        ? ` ${deaths} scout${deaths > 1 ? "s" : ""} did not return.`
        : "";
    gs.choiceEvents.push({
      id: "cotf_scouting_success",
      title: "Scouts Return",
      desc: `${survivors} scout${survivors > 1 ? "s" : ""} returned from the forest.${deathText} They report approximately ${customData.creatureCount} creatures lurking in the shadows.`,
      choices: () => [{ desc: "Now we know what we're dealing with" }],
    } as any);

    // Update hunting subevent description with creature count and make it visible
    const huntingSubEvent = eventData.subEvents.find(
      (se) => se.id === "hunting",
    );
    if (huntingSubEvent) {
      huntingSubEvent.desc = `${customData.creatureCount} creatures have been spotted. Organize a hunting party to eliminate them.`;
      huntingSubEvent.visible = true;
    }
  }

  // Check for work refusal threshold
  if (customData.deathCount >= 5 && !customData.forestWorkRefused) {
    customData.forestWorkRefused = true;
    gs.choiceEvents.push({
      id: "cotf_work_refusal",
      title: "Villagers Refuse Forest Work",
      desc: "After so many deaths, the villagers are terrified. They refuse to work in the forest until the creatures are eliminated.",
      choices: () => [{ desc: "We must deal with these creatures" }],
    } as any);
  }
}

function handleLordScoutingCompletion(
  eventData: EventData,
  gs: GameState,
  scoutingSubEvent: any,
): void {
  if (!gs.lord) return;

  const customData = eventData.customData || {};

  // Calculate lord death chance based on stats
  const str = gs.lord.stats.str;
  const dex = gs.lord.stats.dex;
  const statBonus = (str + dex) / 14;
  const lordDeathChance = Math.max(0.05, 0.3 - statBonus * 0.25);

  if (Math.random() < lordDeathChance) {
    // Lord died during scouting
    scoutingSubEvent.completed = false;
    scoutingSubEvent.inProgress = false;
    gs.choiceEvents.push({
      id: "cotf_lord_scout_death",
      title: "A Lord Falls",
      desc: "The creatures ambushed your scouting party in the deep forest. Despite your best efforts, you were overwhelmed. Your companions barely escaped to tell the tale of your brave but fatal stand.",
      choices: () => [{ desc: "..." }],
    } as any);
    killLord("Killed by forest creatures", gs);
    return;
  }

  // Lord survived - always successful, reveal creature count
  scoutingSubEvent.completed = true;
  scoutingSubEvent.inProgress = false;
  customData.scoutingCompleted = true;

  // Random creature count between 3 and 12
  customData.creatureCount = Math.floor(Math.random() * 10) + 3;

  gs.choiceEvents.push({
    id: "cotf_lord_scout_success",
    title: "The Lord Returns",
    desc: `After days in the forest, you return with crucial intelligence. You've identified approximately ${customData.creatureCount} creatures - large, wolf-like beasts with unnatural intelligence. No villagers died under your leadership.`,
    choices: () => [{ desc: "Now we can plan our attack" }],
  } as any);

  // Update hunting subevent
  const huntingSubEvent = eventData.subEvents.find((se) => se.id === "hunting");
  if (huntingSubEvent) {
    huntingSubEvent.desc = `${customData.creatureCount} creatures have been spotted. Organize a hunting party to eliminate them.`;
    huntingSubEvent.visible = true;
  }
}

function handleHuntingCompletion(
  eventData: EventData,
  gs: GameState,
  huntingSubEvent: any,
): void {
  const customData = eventData.customData || {};

  // Get strategy data from project customData
  const huntingArea = gs.areas.find((a) => a.currentProjects["Hunting_COTF"]);

  // Default strategy values
  let deathChance = 0.2;
  let failureChance = 0.15;
  let workerCount = 6;

  if (huntingArea) {
    const project = huntingArea.currentProjects["Hunting_COTF"];
    if ((project as any).strategyData) {
      const strategyData = (project as any).strategyData;
      deathChance = strategyData.deathChance;
      failureChance = strategyData.failureChance;
      workerCount = strategyData.workerCount;
    }
  }

  // Roll for overall mission failure
  const missionFailed = Math.random() < failureChance;

  if (missionFailed) {
    // Mission failed - all hunters die
    for (let i = 0; i < workerCount; i++) {
      const victim = pick(gs.npcs);
      if (victim) {
        killNPC(victim, "Hunting Creatures", gs);
        customData.deathCount = (customData.deathCount || 0) + 1;
      }
    }

    // Reset hunting subevent so they can try again
    huntingSubEvent.completed = false;
    huntingSubEvent.inProgress = false;

    gs.choiceEvents.push({
      id: "cotf_hunting_failure",
      title: "Hunting Mission Failed",
      desc: `The hunting party was overwhelmed by the creatures. All ${workerCount} hunters perished. We must regroup and try again.`,
      choices: () => [{ desc: "This is a disaster..." }],
    } as any);

    // Check for work refusal threshold
    if (customData.deathCount >= 5 && !customData.forestWorkRefused) {
      customData.forestWorkRefused = true;
      gs.choiceEvents.push({
        id: "cotf_work_refusal",
        title: "Villagers Refuse Forest Work",
        desc: "After so many deaths, the villagers are terrified. They refuse to work in the forest until the creatures are eliminated.",
        choices: () => [{ desc: "We must deal with these creatures" }],
      } as any);
    }
  } else {
    // Mission succeeded - but some hunters may still die
    let deaths = 0;
    for (let i = 0; i < workerCount; i++) {
      if (Math.random() < deathChance) {
        const victim = pick(gs.npcs);
        if (victim) {
          killNPC(victim, "Hunting Creatures", gs);
          customData.deathCount = (customData.deathCount || 0) + 1;
          deaths++;
        }
      }
    }

    // Mark as completed
    huntingSubEvent.completed = true;
    huntingSubEvent.inProgress = false;
    customData.huntingCompleted = true;

    const deathText =
      deaths > 0
        ? ` However, ${deaths} hunter${deaths > 1 ? "s" : ""} fell in battle.`
        : " No one was lost!";
    gs.choiceEvents.push({
      id: "cotf_hunting_success",
      title: "Creatures Eliminated",
      desc: `The hunting party returned victorious! The creatures have been slain.${deathText} The forest is safe once again.`,
      choices: () => [
        { desc: deaths > 0 ? "They died heroes" : "Excellent work!" },
      ],
    } as any);

    // Check for work refusal threshold even on success
    if (
      deaths > 0 &&
      customData.deathCount >= 5 &&
      !customData.forestWorkRefused
    ) {
      customData.forestWorkRefused = true;
      gs.choiceEvents.push({
        id: "cotf_work_refusal",
        title: "Villagers Refuse Forest Work",
        desc: "After so many deaths, the villagers are terrified. They refuse to work in the forest until the creatures are eliminated.",
        choices: () => [{ desc: "We must deal with these creatures" }],
      } as any);
    }
  }
}

function handleLordHuntingCompletion(
  eventData: EventData,
  gs: GameState,
  huntingSubEvent: any,
): void {
  if (!gs.lord) return;

  const customData = eventData.customData || {};

  // Calculate lord death chance based on stats
  const str = gs.lord.stats.str;
  const dex = gs.lord.stats.dex;

  // STR matters more in combat, DEX matters for avoiding attacks
  const strWeight = 0.6;
  const dexWeight = 0.4;
  const combatStatBonus = (str / 7) * strWeight + (dex / 7) * dexWeight;

  const lordDeathChance = Math.max(0.08, 0.35 - combatStatBonus * 0.27);

  if (Math.random() < lordDeathChance) {
    // Lord died during hunting
    huntingSubEvent.completed = false;
    huntingSubEvent.inProgress = false;
    gs.choiceEvents.push({
      id: "cotf_lord_hunt_death",
      title: "A Lord Falls in Battle",
      desc: "The creatures proved too numerous and too vicious. In a desperate last stand, you gave your life so your companions could escape. They returned to tell of your bravery, but the village mourns the loss of their leader.",
      choices: () => [{ desc: "..." }],
    } as any);
    killLord("Killed by forest creatures", gs);
    return;
  }

  // Lord survived - always successful, no villager deaths
  huntingSubEvent.completed = true;
  huntingSubEvent.inProgress = false;
  customData.huntingCompleted = true;

  gs.choiceEvents.push({
    id: "cotf_lord_hunt_success",
    title: "Victorious Return",
    desc: "After days of fierce combat, you return bloodied but victorious. Every creature has been slain. Your companions speak in awe of your combat prowess, and not a single villager fell under your command. The forest is safe once more.",
    choices: () => [{ desc: "The deed is done" }],
  } as any);
}

// Note: Choice generator handlers would be registered separately
// This file demonstrates the event template and action handlers
