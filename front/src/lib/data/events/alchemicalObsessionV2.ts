/**
 * The Alchemical Obsession Event Chain - V2 (JSON-Serializable)
 *
 * This multi-decade event chain follows a lord's descent into alchemical madness
 * as they pursue the legendary Philosopher's Stone.
 *
 * Converted to V2 JSON-serializable architecture.
 */

import type { EventTemplate, EventData, ChoiceData } from "../events";
import type { GameState } from "$lib/stores";
import { killLord, killNPC } from "$lib/simulation/mortality";
import { ruinBuilding } from "$lib/data/buildings";
import { pick } from "$lib/util/rolls";
import {
  registerEventActionHandler,
  registerEventResolvedHandler,
  registerChoiceGeneratorHandler,
  registerEffectHandler,
} from "../handlers/registry";

// ===== EVENT TEMPLATE =====

export const alchemicalObsessionTemplate: EventTemplate = {
  id: "alchemical_obsession",
  target: "Area",
  desc: "The pursuit of the Philosopher's Stone begins...",
  initialPhase: {
    id: "initial_dream",
    name: "The First Dream",
    desc: "The lord has begun dreaming of ancient alchemical secrets...",
  },
  subEvents: [
    {
      id: "initial_research",
      title: "Study Ancient Texts",
      desc: "Dedicate time to studying alchemical manuscripts",
      choiceGeneratorId: "alchemy_initial_research_choices",
    },
    {
      id: "build_laboratory",
      title: "Build First Laboratory",
      desc: "Construct a laboratory to begin experiments",
      choiceGeneratorId: "alchemy_laboratory_choices",
    },
    {
      id: "discover_sulfur",
      title: "Discover Sulfur Deposits",
      desc: "Search for sulfur, one of the three primes",
      choiceGeneratorId: "alchemy_sulfur_choices",
    },
    {
      id: "discover_mercury",
      title: "Discover Mercury Deposits",
      desc: "Search for mercury, the spirit metal",
      choiceGeneratorId: "alchemy_mercury_choices",
    },
    {
      id: "toxic_revelation",
      title: "The Toxic Revelation",
      desc: "Workers begin suffering from exposure...",
      choiceGeneratorId: "alchemy_toxic_revelation_choices",
    },
    {
      id: "great_sacrifice",
      title: "The Great Sacrifice",
      desc: "The work demands more than mere resources...",
      choiceGeneratorId: "alchemy_great_sacrifice_choices",
    },
    {
      id: "grand_athanor",
      title: "Construct the Grand Athanor",
      desc: "Build the ultimate alchemical furnace",
      choiceGeneratorId: "alchemy_grand_athanor_choices",
    },
    {
      id: "prima_materia",
      title: "Create Prima Materia",
      desc: "Transmute base materials into the First Matter",
      choiceGeneratorId: "alchemy_prima_materia_choices",
    },
    {
      id: "final_transmutation",
      title: "The Final Transmutation",
      desc: "Attempt to create the Philosopher's Stone",
      choiceGeneratorId: "alchemy_final_transmutation_choices",
    },
  ],
  actionHandlerId: "alchemy_daily_action",
  resolvedHandlerId: "alchemy_is_resolved",
  condition: {
    type: "Time",
    mtth: 365, // Rare event
  },
  multiple: false,
  customData: {
    yearsActive: 0,
    startYear: 0,
    laboratoriesBuilt: 0,
    sulfurMinesBuilt: 0,
    mercuryMinesBuilt: 0,
    athanorBuilt: false,
    workersLostToToxicity: 0,
    lordHealthDeclining: false,
    lordMadnessLevel: 0, // 0-100 scale
    villagersSacrificed: 0,
    mineCollapsed: false,
    starvationDeaths: 0,
    finalChoice: false,
  },
};

// ===== HANDLER REGISTRATIONS =====

// Daily action handler
registerEventActionHandler(
  "alchemy_daily_action",
  (eventData: EventData, gs: GameState) => {
    if (!gs.lord) return;

    const customData = eventData.customData || {};

    // Initialize start year on first run
    if (!customData.startYear) {
      customData.startYear = gs.currentYear;
    }

    // Calculate years active
    customData.yearsActive = gs.currentYear - customData.startYear;

    // Only process daily effects during day transitions (Morning period)
    if (gs.currentPeriod === "Morning") {
      processPhaseEffects(eventData, gs);
    }

    // Progress through phases
    progressPhases(eventData, gs);
  },
);

// Resolved check handler
registerEventResolvedHandler(
  "alchemy_is_resolved",
  (eventData: EventData, gs: GameState) => {
    return eventData.customData?.finalChoice === true;
  },
);

// ===== HELPER FUNCTIONS =====

function processPhaseEffects(eventData: EventData, gs: GameState) {
  if (!gs.lord) return;

  const customData = eventData.customData || {};
  const phaseId = eventData.phase.id;

  // Toxic Obsession phase onwards: chance of worker death from toxicity
  if (
    [
      "toxic_obsession",
      "great_sacrifice",
      "grand_athanor",
      "prima_materia",
      "final_transmutation",
    ].includes(phaseId)
  ) {
    // 0.2% chance per day that an alchemist/miner dies from toxic exposure
    const alchemists = gs.npcs.filter(
      (npc) =>
        npc.job.title === "Alchemist" ||
        npc.job.title === "Sulfur Miner" ||
        npc.job.title === "Mercury Miner" ||
        npc.job.title === "Master Alchemist",
    );

    alchemists.forEach((worker) => {
      if (Math.random() < 0.002) {
        killNPC(worker, "Toxic Fumes", gs);
        customData.workersLostToToxicity =
          (customData.workersLostToToxicity || 0) + 1;
        customData.lordMadnessLevel = (customData.lordMadnessLevel || 0) + 2;
        gs.choiceEvents.push({
          id: "alchemy_toxicity_death",
          title: "Death by Fumes",
          desc: `${worker.fName} has died from toxic exposure in the alchemical operations. Their lungs were filled with mercury vapor.`,
          choices: () => [{ desc: "A tragic necessity..." }],
        } as any);

        gs.village.trust = Math.max(0, gs.village.trust - 10);
      }
    });
  }

  // Great Sacrifice phase onwards: lord's health declining
  if (
    [
      "great_sacrifice",
      "grand_athanor",
      "prima_materia",
      "final_transmutation",
    ].includes(phaseId)
  ) {
    if (!customData.lordHealthDeclining) {
      customData.lordHealthDeclining = true;
      gs.choiceEvents.push({
        id: "alchemy_lord_health_declining",
        title: "Your Health Fails",
        desc: "You've been exposed to toxic substances for years now. Your hands tremble constantly, you cough blood, and your hair is falling out. But the work must continue.",
        choices: () => [{ desc: "I will endure" }],
      } as any);
    }

    // Slowly reduce lord's stats
    if (Math.random() < 0.001 && gs.lord) {
      if (gs.lord.stats.str > 1) gs.lord.stats.str--;
      if (gs.lord.stats.dex > 1) gs.lord.stats.dex--;
    }
  }

  // Prima Materia phase: food being consumed for alchemy causes starvation
  if (["prima_materia", "final_transmutation"].includes(phaseId)) {
    // 0.1% chance per day that food shortages kill a villager
    if (Math.random() < 0.001) {
      const victim = pick(gs.npcs);
      if (victim) {
        killNPC(victim, "Starvation (Alchemy)", gs);
        customData.starvationDeaths = (customData.starvationDeaths || 0) + 1;
        customData.lordMadnessLevel = (customData.lordMadnessLevel || 0) + 3;
        gs.village.trust = Math.max(0, gs.village.trust - 15);
        gs.choiceEvents.push({
          id: "alchemy_starvation_death",
          title: "Starvation",
          desc: `${victim.fName} has starved to death. You've been consuming so much food for alchemical processes that there isn't enough for the villagers.`,
          choices: () => [{ desc: "The work requires sacrifice" }],
        } as any);
      }
    }
  }

  // Madness increases over time
  if ((customData.yearsActive || 0) > 5) {
    // Every 365 days, small chance to increase madness
    if (gs.currentDay === 1 && Math.random() < 0.3) {
      customData.lordMadnessLevel = Math.min(
        100,
        (customData.lordMadnessLevel || 0) + 1,
      );
    }
  }
}

function progressPhases(eventData: EventData, gs: GameState) {
  if (!gs.lord) return;

  const customData = eventData.customData || {};
  const phaseId = eventData.phase.id;
  const yearsActive = customData.yearsActive || 0;

  // Manage subevent visibility
  updateSubEventVisibility(eventData);

  // Transition from initial dream to first laboratory after 2 years
  if (phaseId === "initial_dream" && yearsActive >= 2) {
    eventData.phase.id = "first_laboratory";
    eventData.phase.name = "The First Laboratory";
    gs.choiceEvents.push(createPhaseTransitionNotification(1));
  }

  // Transition to toxic obsession after 5 years and mines are built
  if (
    phaseId === "first_laboratory" &&
    yearsActive >= 5 &&
    (customData.sulfurMinesBuilt || 0) > 0 &&
    (customData.mercuryMinesBuilt || 0) > 0
  ) {
    eventData.phase.id = "toxic_obsession";
    eventData.phase.name = "Toxic Obsession";
    gs.choiceEvents.push(createPhaseTransitionNotification(2));
  }

  // Transition to great sacrifice after 10 years
  if (phaseId === "toxic_obsession" && yearsActive >= 10) {
    eventData.phase.id = "great_sacrifice";
    eventData.phase.name = "The Great Sacrifice";
    gs.choiceEvents.push(createPhaseTransitionNotification(3));
    const sacrificeSubEvent = eventData.subEvents.find(
      (se) => se.id === "great_sacrifice",
    );
    if (sacrificeSubEvent) sacrificeSubEvent.visible = true;
  }

  // Transition to grand athanor after 15 years
  if (phaseId === "great_sacrifice" && yearsActive >= 15) {
    eventData.phase.id = "grand_athanor";
    eventData.phase.name = "The Grand Athanor";
    gs.choiceEvents.push(createPhaseTransitionNotification(4));
    const athanorSubEvent = eventData.subEvents.find(
      (se) => se.id === "grand_athanor",
    );
    if (athanorSubEvent) athanorSubEvent.visible = true;
  }

  // Transition to prima materia after 25 years and athanor is built
  if (
    phaseId === "grand_athanor" &&
    yearsActive >= 25 &&
    customData.athanorBuilt
  ) {
    eventData.phase.id = "prima_materia";
    eventData.phase.name = "The Prima Materia";
    gs.choiceEvents.push(createPhaseTransitionNotification(5));
    const primaSubEvent = eventData.subEvents.find(
      (se) => se.id === "prima_materia",
    );
    if (primaSubEvent) primaSubEvent.visible = true;
  }

  // Transition to final transmutation after 35 years
  if (phaseId === "prima_materia" && yearsActive >= 35) {
    eventData.phase.id = "final_transmutation";
    eventData.phase.name = "The Final Transmutation";
    gs.choiceEvents.push(createPhaseTransitionNotification(6));
    const finalSubEvent = eventData.subEvents.find(
      (se) => se.id === "final_transmutation",
    );
    if (finalSubEvent) finalSubEvent.visible = true;
  }
}

function updateSubEventVisibility(eventData: EventData) {
  const customData = eventData.customData || {};

  // Make laboratory visible after initial research
  const initialResearch = eventData.subEvents.find(
    (se) => se.id === "initial_research",
  );
  const laboratory = eventData.subEvents.find(
    (se) => se.id === "build_laboratory",
  );
  if (initialResearch?.completed && laboratory) {
    laboratory.visible = true;
  }

  // Make sulfur and mercury visible after laboratory built
  const sulfur = eventData.subEvents.find((se) => se.id === "discover_sulfur");
  const mercury = eventData.subEvents.find(
    (se) => se.id === "discover_mercury",
  );
  if ((customData.laboratoriesBuilt || 0) > 0) {
    if (sulfur) sulfur.visible = true;
    if (mercury) mercury.visible = true;
  }

  // Make toxic revelation visible when workers start dying
  const toxicRevelation = eventData.subEvents.find(
    (se) => se.id === "toxic_revelation",
  );
  if (
    (customData.workersLostToToxicity || 0) >= 3 &&
    toxicRevelation &&
    !toxicRevelation.completed
  ) {
    toxicRevelation.visible = true;
  }
}

function createPhaseTransitionNotification(phase: number): any {
  const phases = [
    {
      title: "The Path Deepens",
      desc: "Years have passed. Your obsession grows stronger. The villagers whisper about your late-night experiments.",
    },
    {
      title: "The Toxic Path",
      desc: "The mines produce sulfur and mercury, but workers are falling ill. The cost becomes clear.",
    },
    {
      title: "Blood and Madness",
      desc: "A decade of work. You're no longer the person you were. The obsession consumes you.",
    },
    {
      title: "The Great Furnace",
      desc: "Fifteen years. You know what must be built. The Grand Athanor will consume everything.",
    },
    {
      title: "The First Matter",
      desc: "Twenty-five years. You've broken through to the Prima Materia. Reality bends to your will.",
    },
    {
      title: "The Final Hour",
      desc: "Thirty-five years of obsession. The Philosopher's Stone is within reach. What will you sacrifice for it?",
    },
  ];

  const phaseData = phases[phase - 1];

  return {
    id: `alchemy_phase_transition_${phase}`,
    title: phaseData.title,
    desc: phaseData.desc,
    choices: () => [{ desc: "The work continues..." }],
  };
}

// ===== CHOICE GENERATOR HANDLERS =====

registerChoiceGeneratorHandler(
  "alchemy_initial_research_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Yes, I must discover the truth",
        effectHandlerId: "alchemy_accept_research",
      },
      {
        desc: "These are just dreams, nothing more",
        effectHandlerId: "alchemy_reject_research",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_laboratory_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Build a laboratory",
        requirements: [{ type: "building", data: "Laboratory" }],
        effectHandlerId: "alchemy_build_lab",
      },
      {
        desc: "Not yet, I need more resources",
        effectHandlerId: "alchemy_no_effect",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_sulfur_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Build a sulfur mine",
        requirements: [{ type: "building", data: "Sulfur Mine" }],
        effectHandlerId: "alchemy_build_sulfur_mine",
      },
      {
        desc: "Not yet",
        effectHandlerId: "alchemy_no_effect",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_mercury_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Build a mercury mine",
        requirements: [{ type: "building", data: "Mercury Mine" }],
        effectHandlerId: "alchemy_build_mercury_mine",
      },
      {
        desc: "Not yet",
        effectHandlerId: "alchemy_no_effect",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_toxic_revelation_choices",
  (eventData: EventData, gs: GameState) => {
    const workersLost = eventData.customData?.workersLostToToxicity || 0;
    return [
      {
        desc: "Improve safety measures (50 Bread, slow production)",
        requirements: [{ type: "item", data: "Bread", num: 50, consume: true }],
        effectHandlerId: "alchemy_improve_safety",
      },
      {
        desc: "The work is more important than their complaints",
        effectHandlerId: "alchemy_ignore_safety",
      },
      {
        desc: "Abandon this madness",
        effectHandlerId: "alchemy_abandon",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_great_sacrifice_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "I will see this through, no matter the cost",
        effectHandlerId: "alchemy_sacrifice_self",
      },
      {
        desc: "Sacrifice my best workers (Kill 5 villagers)",
        effectHandlerId: "alchemy_sacrifice_villagers",
      },
      {
        desc: "This has gone too far. I must stop.",
        effectHandlerId: "alchemy_abandon_late",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_grand_athanor_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Build the Grand Athanor",
        requirements: [{ type: "building", data: "Grand Athanor" }],
        effectHandlerId: "alchemy_build_athanor",
      },
      {
        desc: "Not yet",
        effectHandlerId: "alchemy_no_effect",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_prima_materia_choices",
  (eventData: EventData, gs: GameState) => {
    return [
      {
        desc: "Begin Prima Materia creation (20 Tinctures, 500 Bread)",
        requirements: [
          { type: "item", data: "Alchemical Tincture", num: 20, consume: true },
          { type: "item", data: "Bread", num: 500, consume: true },
        ],
        effectHandlerId: "alchemy_create_prima_materia",
      },
      {
        desc: "Not yet",
        effectHandlerId: "alchemy_no_effect",
      },
    ];
  },
);

registerChoiceGeneratorHandler(
  "alchemy_final_transmutation_choices",
  (eventData: EventData, gs: GameState) => {
    const yearsActive = eventData.customData?.yearsActive || 0;
    return [
      {
        desc: "Create the Philosopher's Stone (10 Prima Materia, 5 Sulfur, 5 Mercury)",
        requirements: [
          { type: "item", data: "Prima Materia", num: 10, consume: true },
          { type: "item", data: "Sulfur", num: 5, consume: true },
          { type: "item", data: "Mercury", num: 5, consume: true },
        ],
        effectHandlerId: "alchemy_final_transmutation",
      },
      {
        desc: "I cannot do this. The price is too high.",
        effectHandlerId: "alchemy_final_abandon",
      },
    ];
  },
);

// ===== EFFECT HANDLERS =====

registerEffectHandler("alchemy_no_effect", (eventData, gs) => {});

registerEffectHandler("alchemy_accept_research", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "initial_research",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 5;
  gs.village.trust = Math.max(0, gs.village.trust - 5);
});

registerEffectHandler("alchemy_reject_research", (eventData, gs) => {
  eventData.customData = eventData.customData || {};
  eventData.customData.finalChoice = true;
});

registerEffectHandler("alchemy_build_lab", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "build_laboratory",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.laboratoriesBuilt =
    (eventData.customData.laboratoriesBuilt || 0) + 1;
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 5;

  gs.inventory["Salt"] = (gs.inventory["Salt"] || 0) + 10;

  gs.choiceEvents.push({
    id: "alchemy_lab_complete",
    title: "Laboratory Complete",
    desc: "Your laboratory is complete. Now you can begin true alchemical work. You've obtained some salt to start your experiments.",
    choices: () => [{ desc: "The work begins..." }],
  } as any);
});

registerEffectHandler("alchemy_build_sulfur_mine", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "discover_sulfur",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.sulfurMinesBuilt =
    (eventData.customData.sulfurMinesBuilt || 0) + 1;
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 5;

  gs.choiceEvents.push({
    id: "alchemy_sulfur_found",
    title: "Sulfur Discovered",
    desc: "The miners have found rich deposits of sulfur. The acrid yellow crystals burn your nostrils. Some workers complain of headaches and nausea.",
    choices: () => [{ desc: "The price of progress..." }],
  } as any);
});

registerEffectHandler("alchemy_build_mercury_mine", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "discover_mercury",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.mercuryMinesBuilt =
    (eventData.customData.mercuryMinesBuilt || 0) + 1;
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 5;

  gs.choiceEvents.push({
    id: "alchemy_mercury_found",
    title: "Mercury Flows",
    desc: "Liquid silver pools in the deep mines. The workers extract it with trembling hands. Some say they see visions after long exposure.",
    choices: () => [{ desc: "The visions may hold truth..." }],
  } as any);
});

registerEffectHandler("alchemy_improve_safety", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "toxic_revelation",
  );
  if (subevent) subevent.completed = true;
  gs.village.trust = Math.min(1000, gs.village.trust + 10);
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 2;
});

registerEffectHandler("alchemy_ignore_safety", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "toxic_revelation",
  );
  if (subevent) subevent.completed = true;
  gs.village.trust = Math.max(0, gs.village.trust - 30);
  gs.village.authority = Math.min(1000, gs.village.authority + 20);
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 10;

  gs.choiceEvents.push({
    id: "alchemy_toxic_ignored",
    title: "Fear and Resentment",
    desc: "The villagers look at you with fear and hatred now. But the work continues.",
    choices: () => [{ desc: "They will understand when I succeed" }],
  } as any);
});

registerEffectHandler("alchemy_abandon", (eventData, gs) => {
  eventData.customData = eventData.customData || {};
  eventData.customData.finalChoice = true;
  gs.village.trust = Math.min(1000, gs.village.trust + 50);

  gs.choiceEvents.push({
    id: "alchemy_abandoned",
    title: "The Dream Ends",
    desc: "You close your laboratory and burn your notes. Perhaps some knowledge is not meant for mortals.",
    choices: () => [{ desc: "It's for the best" }],
  } as any);
});

registerEffectHandler("alchemy_sacrifice_self", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "great_sacrifice",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 15;

  if (gs.lord) {
    gs.lord.stats.str = Math.max(1, gs.lord.stats.str - 2);
    gs.lord.stats.dex = Math.max(1, gs.lord.stats.dex - 2);
  }

  gs.choiceEvents.push({
    id: "alchemy_sacrifice_accepted",
    title: "The Price is Paid",
    desc: "You feel your vitality draining, but your mind sees deeper truths. The path forward becomes clearer.",
    choices: () => [{ desc: "I see beyond the veil now..." }],
  } as any);
});

registerEffectHandler("alchemy_sacrifice_villagers", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "great_sacrifice",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 25;
  eventData.customData.villagersSacrificed =
    (eventData.customData.villagersSacrificed || 0) + 5;

  for (let i = 0; i < 5; i++) {
    const victim = pick(gs.npcs);
    if (victim) {
      killNPC(victim, "Sacrificed for Alchemy", gs);
    }
  }

  gs.village.trust = Math.max(0, gs.village.trust - 100);
  gs.village.authority = Math.min(1000, gs.village.authority + 50);

  gs.choiceEvents.push({
    id: "alchemy_villagers_sacrificed",
    title: "Blood Alchemy",
    desc: "The screams have stopped. Their essence now fuels your work. The villagers will never forgive you.",
    choices: () => [{ desc: "Their deaths will have meaning" }],
  } as any);
});

registerEffectHandler("alchemy_abandon_late", (eventData, gs) => {
  eventData.customData = eventData.customData || {};
  eventData.customData.finalChoice = true;
  gs.village.trust = Math.min(1000, gs.village.trust + 30);

  gs.choiceEvents.push({
    id: "alchemy_abandoned_late",
    title: "Broken Dreams",
    desc: "You lock the laboratory doors. The damage is done, but at least no more will die for your ambition.",
    choices: () => [{ desc: "I hope they can forgive me" }],
  } as any);
});

registerEffectHandler("alchemy_build_athanor", (eventData, gs) => {
  const subevent = eventData.subEvents.find((se) => se.id === "grand_athanor");
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.athanorBuilt = true;
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 10;

  // 30% chance of mine collapse
  if (Math.random() < 0.3) {
    eventData.customData.mineCollapsed = true;
    const mine = gs.areas
      .flatMap((area) => area.buildings)
      .find(
        (b) =>
          b.type === "Mine" ||
          b.type === "Sulfur Mine" ||
          b.type === "Mercury Mine",
      );

    if (mine) {
      ruinBuilding(gs, mine);

      const deaths = Math.floor(Math.random() * 5) + 3;
      for (let i = 0; i < deaths; i++) {
        const victim = pick(gs.npcs);
        if (victim) {
          killNPC(victim, "Mine Collapse", gs);
        }
      }

      gs.choiceEvents.push({
        id: "alchemy_mine_collapse",
        title: "Catastrophe",
        desc: `During construction of the Athanor, a mine has collapsed! ${deaths} workers are dead. The villagers are horrified.`,
        choices: () => [{ desc: "Their sacrifice will be remembered" }],
      } as any);

      gs.village.trust = Math.max(0, gs.village.trust - 50);
    }
  }

  gs.choiceEvents.push({
    id: "alchemy_athanor_complete",
    title: "The Furnace Burns",
    desc: "The Grand Athanor is complete. Its flames burn day and night, fed by an unnatural heat. You can feel reality bending near it.",
    choices: () => [{ desc: "At last, true transmutation is possible" }],
  } as any);
});

registerEffectHandler("alchemy_create_prima_materia", (eventData, gs) => {
  const subevent = eventData.subEvents.find((se) => se.id === "prima_materia");
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.lordMadnessLevel =
    (eventData.customData.lordMadnessLevel || 0) + 15;

  gs.inventory["Prima Materia"] = (gs.inventory["Prima Materia"] || 0) + 5;

  const deaths = Math.floor(Math.random() * 5) + 3;
  for (let i = 0; i < deaths; i++) {
    const victim = pick(gs.npcs);
    if (victim) {
      killNPC(victim, "Starvation (Alchemy)", gs);
      eventData.customData.starvationDeaths =
        (eventData.customData.starvationDeaths || 0) + 1;
    }
  }

  gs.village.trust = Math.max(0, gs.village.trust - 75);

  gs.choiceEvents.push({
    id: "alchemy_prima_created",
    title: "The First Matter",
    desc: `You've created Prima Materia! The formless essence glows with an inner light. ${deaths} villagers starved while you consumed their food. Those who remain look at you with hollow eyes.`,
    choices: () => [{ desc: "They don't understand what I've achieved" }],
  } as any);
});

registerEffectHandler("alchemy_final_transmutation", (eventData, gs) => {
  const subevent = eventData.subEvents.find(
    (se) => se.id === "final_transmutation",
  );
  if (subevent) subevent.completed = true;
  eventData.customData = eventData.customData || {};
  eventData.customData.finalChoice = true;

  // 50% chance the lord dies
  if (Math.random() < 0.5) {
    gs.choiceEvents.push({
      id: "alchemy_lord_dies",
      title: "The Ultimate Price",
      desc: "The transmutation succeeds! The Philosopher's Stone materializes in a burst of blinding light. But as it forms, you feel your life force being drawn into it. You collapse, your body dissolving into golden light. You achieved your life's work, but paid with your life itself.",
      choices: () => [{ desc: "..." }],
    } as any);

    gs.inventory["Philosopher's Stone"] =
      (gs.inventory["Philosopher's Stone"] || 0) + 1;

    if (gs.lord) {
      killLord("Transmutation into Philosopher's Stone", gs);
    }
  } else {
    gs.choiceEvents.push({
      id: "alchemy_lord_survives",
      title: "The Stone is Complete",
      desc: "The Philosopher's Stone lies before you, pulsing with impossible light. You've done it. But at what cost? Your body is ravaged, your mind fractured. The villagers fear and hate you. Yet you hold in your hands the culmination of the Great Work.",
      choices: () => [{ desc: "It was worth everything..." }],
    } as any);

    gs.inventory["Philosopher's Stone"] =
      (gs.inventory["Philosopher's Stone"] || 0) + 1;

    if (gs.lord) {
      gs.lord.stats.str = 1;
      gs.lord.stats.dex = 1;
    }

    if (gs.lord && gs.lord.goal.name === "Discover Alchemy") {
      gs.lord.goal.effect(gs);
    }
  }

  gs.village.trust = Math.max(0, gs.village.trust - 200);
});

registerEffectHandler("alchemy_final_abandon", (eventData, gs) => {
  eventData.customData = eventData.customData || {};
  eventData.customData.finalChoice = true;
  const yearsActive = eventData.customData.yearsActive || 0;

  gs.choiceEvents.push({
    id: "alchemy_final_abandoned",
    title: "The Long Walk Away",
    desc: `After ${yearsActive} years, you step away from the Grand Athanor. The Prima Materia dissolves. Your life's work remains incomplete. Perhaps that is for the best.`,
    choices: () => [{ desc: "Some doors should remain closed" }],
  } as any);

  gs.village.trust = Math.min(1000, gs.village.trust + 20);
});
