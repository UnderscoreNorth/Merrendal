import { killLord, killNPC } from "$lib/simulation/mortality";
import { ruinBuilding } from "$lib/data/buildings";
import type { GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import type { Choice, type ChoiceEvent } from "../choices";
import { Event, type EventContainer, type SubEvent } from "../events";
import type { Project } from "../projects/project";

/**
 * The Alchemical Obsession Event Chain
 *
 * This multi-decade event chain follows a lord's descent into alchemical madness
 * as they pursue the legendary Philosopher's Stone. Each phase brings increasing
 * requirements, negative consequences, and tests the lord's resolve.
 *
 * Phases:
 * 1. Initial Dreams (Year 0-2): First visions, basic research
 * 2. The First Laboratory (Year 2-5): Build lab, discover sulfur/mercury
 * 3. Toxic Obsession (Year 5-10): Mining accidents, worker deaths, trust loss
 * 4. The Great Sacrifice (Year 10-15): Personal health decline, major choices
 * 5. The Grand Athanor (Year 15-25): Massive construction, mine collapse risk
 * 6. The Prima Materia (Year 25-35): Food shortages, starvation, madness
 * 7. Final Transmutation (Year 35+): Ultimate choice, potential death
 */

class Event_AlchemicalObsession extends Event {
  // Track years since event started
  private yearsActive: number = 0;
  private startYear: number = 0;

  constructor(id: string) {
    super(id);
    this.target = "Area";
    this.phase = {
      id: "initial_dream",
      name: "The First Dream",
      desc: "The lord has begun dreaming of ancient alchemical secrets...",
      yearsActive: 0,
      laboratoriesBuilt: 0,
      sulfurMinesBuilt: 0,
      mercuryMinesBuilt: 0,
      athanorBuilt: false,
      workersLostToToxicity: 0,
      lordHealthDeclining: false,
      lordMadnessLevel: 0, // 0-100 scale of madness
      villagersSacrificed: 0,
      mineCollapsed: false,
      starvationDeaths: 0,
      finalChoice: false,
    };
    this.desc = "The pursuit of the Philosopher's Stone begins...";

    // Define the sub-events for each phase
    this.subEvents = [
      {
        id: "initial_research",
        title: "Study Ancient Texts",
        desc: "Dedicate time to studying alchemical manuscripts",
        completed: false,
        visible: true, // Always visible at start
        createChoiceEvent: (parentEvent) =>
          createInitialResearchChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "build_laboratory",
        title: "Build First Laboratory",
        desc: "Construct a laboratory to begin experiments",
        completed: false,
        visible: false, // Visible after initial research
        createChoiceEvent: (parentEvent) =>
          createLaboratoryChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "discover_sulfur",
        title: "Discover Sulfur Deposits",
        desc: "Search for sulfur, one of the three primes",
        completed: false,
        visible: false, // Visible after laboratory built
        createChoiceEvent: (parentEvent) =>
          createSulfurDiscoveryChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "discover_mercury",
        title: "Discover Mercury Deposits",
        desc: "Search for mercury, the spirit metal",
        completed: false,
        visible: false, // Visible after laboratory built
        createChoiceEvent: (parentEvent) =>
          createMercuryDiscoveryChoice(
            parentEvent as Event_AlchemicalObsession,
          ),
      },
      {
        id: "toxic_revelation",
        title: "The Toxic Revelation",
        desc: "Workers begin suffering from exposure...",
        completed: false,
        visible: false, // Visible when workers start dying
        createChoiceEvent: (parentEvent) =>
          createToxicRevelationChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "great_sacrifice",
        title: "The Great Sacrifice",
        desc: "The work demands more than mere resources...",
        completed: false,
        visible: false, // Visible in great_sacrifice phase
        createChoiceEvent: (parentEvent) =>
          createGreatSacrificeChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "grand_athanor",
        title: "Construct the Grand Athanor",
        desc: "Build the ultimate alchemical furnace",
        completed: false,
        visible: false, // Visible in grand_athanor phase
        createChoiceEvent: (parentEvent) =>
          createGrandAthanorChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "prima_materia",
        title: "Create Prima Materia",
        desc: "Transmute base materials into the First Matter",
        completed: false,
        visible: false, // Visible after athanor built
        createChoiceEvent: (parentEvent) =>
          createPrimaMateriaChoice(parentEvent as Event_AlchemicalObsession),
      },
      {
        id: "final_transmutation",
        title: "The Final Transmutation",
        desc: "Attempt to create the Philosopher's Stone",
        completed: false,
        visible: false, // Visible in final phase
        createChoiceEvent: (parentEvent) =>
          createFinalTransmutationChoice(
            parentEvent as Event_AlchemicalObsession,
          ),
      },
    ];

    this.action = ({ gs }) => {
      if (!gs || !gs.lord) return;

      // Initialize start year on first run
      if (this.startYear === 0) {
        this.startYear = gs.currentYear;
      }

      // Calculate years active
      this.yearsActive = gs.currentYear - this.startYear;
      this.phase.yearsActive = this.yearsActive;

      // Only process daily effects during day transitions (Morning period)
      if (gs.currentPeriod === "Morning") {
        this.processPhaseEffects(gs);
      }

      // Progress through phases based on time and conditions
      this.progressPhases(gs);
    };

    this.resolved = ({ gs }) => {
      return this.phase.finalChoice === true;
    };
  }

  private processPhaseEffects(gs: GameState) {
    if (!gs.lord) return;

    // Random daily chances for negative events based on phase
    const phaseId = this.phase.id;

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
          this.phase.workersLostToToxicity++;
          this.phase.lordMadnessLevel += 2;
          gs.choiceEvents.push(createToxicityDeathNotification(worker.fName));

          // Decrease village trust
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
      if (!this.phase.lordHealthDeclining) {
        this.phase.lordHealthDeclining = true;
        gs.choiceEvents.push(createLordHealthDecliningNotification());
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
          this.phase.starvationDeaths++;
          this.phase.lordMadnessLevel += 3;
          gs.village.trust = Math.max(0, gs.village.trust - 15);
          gs.choiceEvents.push(createStarvationDeathNotification(victim.fName));
        }
      }
    }

    // Madness increases over time
    if (this.yearsActive > 5) {
      // Every 365 days, small chance to increase madness
      if (gs.currentDay === 1 && Math.random() < 0.3) {
        this.phase.lordMadnessLevel = Math.min(
          100,
          this.phase.lordMadnessLevel + 1,
        );
      }
    }
  }

  private progressPhases(gs: GameState) {
    if (!gs.lord) return;

    const phaseId = this.phase.id;

    // Manage subevent visibility based on completion
    this.updateSubEventVisibility();

    // Transition from initial dream to first laboratory after 2 years
    if (phaseId === "initial_dream" && this.yearsActive >= 2) {
      this.phase.id = "first_laboratory";
      this.phase.name = "The First Laboratory";
      gs.choiceEvents.push(createPhaseTransitionNotification(1));
    }

    // Transition to toxic obsession after 5 years and mines are built
    if (
      phaseId === "first_laboratory" &&
      this.yearsActive >= 5 &&
      this.phase.sulfurMinesBuilt > 0 &&
      this.phase.mercuryMinesBuilt > 0
    ) {
      this.phase.id = "toxic_obsession";
      this.phase.name = "Toxic Obsession";
      gs.choiceEvents.push(createPhaseTransitionNotification(2));
    }

    // Transition to great sacrifice after 10 years
    if (phaseId === "toxic_obsession" && this.yearsActive >= 10) {
      this.phase.id = "great_sacrifice";
      this.phase.name = "The Great Sacrifice";
      gs.choiceEvents.push(createPhaseTransitionNotification(3));
      // Make great sacrifice subevent visible
      const sacrificeSubEvent = this.subEvents.find(
        (se) => se.id === "great_sacrifice",
      );
      if (sacrificeSubEvent) sacrificeSubEvent.visible = true;
    }

    // Transition to grand athanor after 15 years
    if (phaseId === "great_sacrifice" && this.yearsActive >= 15) {
      this.phase.id = "grand_athanor";
      this.phase.name = "The Grand Athanor";
      gs.choiceEvents.push(createPhaseTransitionNotification(4));
      // Make grand athanor subevent visible
      const athanorSubEvent = this.subEvents.find(
        (se) => se.id === "grand_athanor",
      );
      if (athanorSubEvent) athanorSubEvent.visible = true;
    }

    // Transition to prima materia after 25 years and athanor is built
    if (
      phaseId === "grand_athanor" &&
      this.yearsActive >= 25 &&
      this.phase.athanorBuilt
    ) {
      this.phase.id = "prima_materia";
      this.phase.name = "The Prima Materia";
      gs.choiceEvents.push(createPhaseTransitionNotification(5));
      // Make prima materia subevent visible
      const primaSubEvent = this.subEvents.find(
        (se) => se.id === "prima_materia",
      );
      if (primaSubEvent) primaSubEvent.visible = true;
    }

    // Transition to final transmutation after 35 years
    if (phaseId === "prima_materia" && this.yearsActive >= 35) {
      this.phase.id = "final_transmutation";
      this.phase.name = "The Final Transmutation";
      gs.choiceEvents.push(createPhaseTransitionNotification(6));
      // Make final transmutation subevent visible
      const finalSubEvent = this.subEvents.find(
        (se) => se.id === "final_transmutation",
      );
      if (finalSubEvent) finalSubEvent.visible = true;
    }
  }

  private updateSubEventVisibility() {
    // Make laboratory visible after initial research
    const initialResearch = this.subEvents.find(
      (se) => se.id === "initial_research",
    );
    const laboratory = this.subEvents.find(
      (se) => se.id === "build_laboratory",
    );
    if (initialResearch?.completed && laboratory) {
      laboratory.visible = true;
    }

    // Make sulfur and mercury visible after laboratory built
    const sulfur = this.subEvents.find((se) => se.id === "discover_sulfur");
    const mercury = this.subEvents.find((se) => se.id === "discover_mercury");
    if (this.phase.laboratoriesBuilt > 0) {
      if (sulfur) sulfur.visible = true;
      if (mercury) mercury.visible = true;
    }

    // Make toxic revelation visible when workers start dying
    const toxicRevelation = this.subEvents.find(
      (se) => se.id === "toxic_revelation",
    );
    if (
      this.phase.workersLostToToxicity >= 3 &&
      toxicRevelation &&
      !toxicRevelation.completed
    ) {
      toxicRevelation.visible = true;
    }
  }
}

export const event_AlchemicalObsession = {
  id: "Alchemical Obsession",
  condition: { type: "Time", mtth: 365 }, // Rare event
  multiple: false,
  event: Event_AlchemicalObsession,
} as const satisfies EventContainer;

// ===== CHOICE EVENT CREATORS =====

function createInitialResearchChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_initial_research",
    title: "Dreams of Gold",
    desc: "You've been having vivid dreams of ancient alchemical secrets. Old texts speak of the Philosopher's Stone - a legendary substance that can transmute lead into gold and grant immortality. Do you wish to pursue this knowledge?",
    choices: (gs) => {
      return [
        {
          desc: "Yes, I must discover the truth",
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "initial_research",
            );
            if (subevent) subevent.completed = true;
            event.phase.lordMadnessLevel += 5;
            gs.village.trust = Math.max(0, gs.village.trust - 5);
          },
        },
        {
          desc: "These are just dreams, nothing more",
          effects: (gs) => {
            // Abandon the event chain
            event.phase.finalChoice = true;
          },
        },
      ];
    },
  };
}

function createLaboratoryChoice(event: Event_AlchemicalObsession): ChoiceEvent {
  return {
    id: "alchemy_build_laboratory",
    title: "The First Laboratory",
    desc: "To begin your alchemical research, you need a proper laboratory. This will require significant resources and workers skilled in delicate work.",
    choices: (gs) => {
      return [
        {
          desc: "Build a laboratory",
          requirements: [{ type: "building", data: "Laboratory" }],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "build_laboratory",
            );
            if (subevent) subevent.completed = true;
            event.phase.laboratoriesBuilt++;
            event.phase.lordMadnessLevel += 5;

            // Give player some initial salt to start experiments
            gs.inventory["Salt"] = (gs.inventory["Salt"] || 0) + 10;

            gs.choiceEvents.push({
              id: "alchemy_lab_complete",
              title: "Laboratory Complete",
              desc: "Your laboratory is complete. Now you can begin true alchemical work. You've obtained some salt to start your experiments.",
              choices: () => [{ desc: "The work begins..." }],
            });
          },
        },
        {
          desc: "Not yet, I need more resources",
          effects: () => {},
        },
      ];
    },
  };
}

function createSulfurDiscoveryChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_sulfur_discovery",
    title: "The Yellow Stone",
    desc: "Sulfur - the fiery principle, the soul of metals. Ancient texts describe it as essential to the Great Work. You must find a source.",
    choices: (gs) => {
      return [
        {
          desc: "Build a sulfur mine",
          requirements: [{ type: "building", data: "Sulfur Mine" }],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "discover_sulfur",
            );
            if (subevent) subevent.completed = true;
            event.phase.sulfurMinesBuilt++;
            event.phase.lordMadnessLevel += 5;

            gs.choiceEvents.push({
              id: "alchemy_sulfur_found",
              title: "Sulfur Discovered",
              desc: "The miners have found rich deposits of sulfur. The acrid yellow crystals burn your nostrils. Some workers complain of headaches and nausea.",
              choices: () => [{ desc: "The price of progress..." }],
            });
          },
        },
        {
          desc: "Not yet",
          effects: () => {},
        },
      ];
    },
  };
}

function createMercuryDiscoveryChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_mercury_discovery",
    title: "The Quicksilver",
    desc: "Mercury - the spirit, the messenger. The living metal that flows like water. Essential to transmutation.",
    choices: (gs) => {
      return [
        {
          desc: "Build a mercury mine",
          requirements: [{ type: "building", data: "Mercury Mine" }],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "discover_mercury",
            );
            if (subevent) subevent.completed = true;
            event.phase.mercuryMinesBuilt++;
            event.phase.lordMadnessLevel += 5;

            gs.choiceEvents.push({
              id: "alchemy_mercury_found",
              title: "Mercury Flows",
              desc: "Liquid silver pools in the deep mines. The workers extract it with trembling hands. Some say they see visions after long exposure.",
              choices: () => [{ desc: "The visions may hold truth..." }],
            });
          },
        },
        {
          desc: "Not yet",
          effects: () => {},
        },
      ];
    },
  };
}

function createToxicRevelationChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_toxic_revelation",
    title: "The Toxic Price",
    desc: `Your alchemical workers are falling ill. ${event.phase.workersLostToToxicity} have died from toxic fumes. The villagers are afraid, yet the work must continue. What will you do?`,
    choices: (gs) => {
      return [
        {
          desc: "Improve safety measures (50 Bread, slow production)",
          requirements: [
            { type: "item", data: "Bread", num: 50, consume: true },
          ],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "toxic_revelation",
            );
            if (subevent) subevent.completed = true;
            gs.village.trust = Math.min(1000, gs.village.trust + 10);
            event.phase.lordMadnessLevel += 2;
          },
        },
        {
          desc: "The work is more important than their complaints",
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "toxic_revelation",
            );
            if (subevent) subevent.completed = true;
            gs.village.trust = Math.max(0, gs.village.trust - 30);
            gs.village.authority = Math.min(1000, gs.village.authority + 20);
            event.phase.lordMadnessLevel += 10;

            gs.choiceEvents.push({
              id: "alchemy_toxic_ignored",
              title: "Fear and Resentment",
              desc: "The villagers look at you with fear and hatred now. But the work continues.",
              choices: () => [{ desc: "They will understand when I succeed" }],
            });
          },
        },
        {
          desc: "Abandon this madness",
          effects: (gs) => {
            event.phase.finalChoice = true;
            gs.village.trust = Math.min(1000, gs.village.trust + 50);

            gs.choiceEvents.push({
              id: "alchemy_abandoned",
              title: "The Dream Ends",
              desc: "You close your laboratory and burn your notes. Perhaps some knowledge is not meant for mortals.",
              choices: () => [{ desc: "It's for the best" }],
            });
          },
        },
      ];
    },
  };
}

function createGreatSacrificeChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_great_sacrifice",
    title: "The Great Sacrifice",
    desc: "You've been working for a decade, and you feel yourself changing. Your hands shake, your vision blurs. The texts speak of sacrifice - not just of materials, but of life itself. Do you press on?",
    choices: (gs) => {
      return [
        {
          desc: "I will see this through, no matter the cost",
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "great_sacrifice",
            );
            if (subevent) subevent.completed = true;
            event.phase.lordMadnessLevel += 15;

            if (gs.lord) {
              // Significant stat reduction
              gs.lord.stats.str = Math.max(1, gs.lord.stats.str - 2);
              gs.lord.stats.dex = Math.max(1, gs.lord.stats.dex - 2);
            }

            gs.choiceEvents.push({
              id: "alchemy_sacrifice_accepted",
              title: "The Price is Paid",
              desc: "You feel your vitality draining, but your mind sees deeper truths. The path forward becomes clearer.",
              choices: () => [{ desc: "I see beyond the veil now..." }],
            });
          },
        },
        {
          desc: "Sacrifice my best workers (Kill 5 villagers)",
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "great_sacrifice",
            );
            if (subevent) subevent.completed = true;
            event.phase.lordMadnessLevel += 25;
            event.phase.villagersSacrificed += 5;

            // Kill 5 random villagers
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
            });
          },
        },
        {
          desc: "This has gone too far. I must stop.",
          effects: (gs) => {
            event.phase.finalChoice = true;
            gs.village.trust = Math.min(1000, gs.village.trust + 30);

            gs.choiceEvents.push({
              id: "alchemy_abandoned_late",
              title: "Broken Dreams",
              desc: "You lock the laboratory doors. The damage is done, but at least no more will die for your ambition.",
              choices: () => [{ desc: "I hope they can forgive me" }],
            });
          },
        },
      ];
    },
  };
}

function createGrandAthanorChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_grand_athanor",
    title: "The Grand Athanor",
    desc: "After 15 years of research, you know what you need: the Grand Athanor, an alchemical furnace capable of sustaining the heat needed for the Great Work. It will be massive, dangerous, and consume enormous resources.",
    choices: (gs) => {
      return [
        {
          desc: "Build the Grand Athanor",
          requirements: [{ type: "building", data: "Grand Athanor" }],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "grand_athanor",
            );
            if (subevent) subevent.completed = true;
            event.phase.athanorBuilt = true;
            event.phase.lordMadnessLevel += 10;

            // 30% chance of mine collapse during construction
            if (Math.random() < 0.3) {
              event.phase.mineCollapsed = true;
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

                // Kill workers in the mine
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
                  choices: () => [
                    { desc: "Their sacrifice will be remembered" },
                  ],
                });

                gs.village.trust = Math.max(0, gs.village.trust - 50);
              }
            }

            gs.choiceEvents.push({
              id: "alchemy_athanor_complete",
              title: "The Furnace Burns",
              desc: "The Grand Athanor is complete. Its flames burn day and night, fed by an unnatural heat. You can feel reality bending near it.",
              choices: () => [
                { desc: "At last, true transmutation is possible" },
              ],
            });
          },
        },
        {
          desc: "Not yet",
          effects: () => {},
        },
      ];
    },
  };
}

function createPrimaMateriaChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_prima_materia",
    title: "The Prima Materia",
    desc: "The Prima Materia - the First Matter from which all things are made. You must create it by breaking down substances to their essence. This requires enormous amounts of food and alchemical tinctures. The villagers will starve while you consume their food for your experiments.",
    choices: (gs) => {
      const hasResources =
        (gs.inventory["Alchemical Tincture"] || 0) >= 20 &&
        (gs.inventory["Bread"] || 0) >= 500;

      return [
        {
          desc: "Begin Prima Materia creation (20 Tinctures, 500 Bread)",
          requirements: [
            {
              type: "item",
              data: "Alchemical Tincture",
              num: 20,
              consume: true,
            },
            { type: "item", data: "Bread", num: 500, consume: true },
          ],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "prima_materia",
            );
            if (subevent) subevent.completed = true;
            event.phase.lordMadnessLevel += 15;

            // Create some Prima Materia
            gs.inventory["Prima Materia"] =
              (gs.inventory["Prima Materia"] || 0) + 5;

            // Kill 3-7 villagers from starvation
            const deaths = Math.floor(Math.random() * 5) + 3;
            for (let i = 0; i < deaths; i++) {
              const victim = pick(gs.npcs);
              if (victim) {
                killNPC(victim, "Starvation (Alchemy)", gs);
                event.phase.starvationDeaths++;
              }
            }

            gs.village.trust = Math.max(0, gs.village.trust - 75);

            gs.choiceEvents.push({
              id: "alchemy_prima_created",
              title: "The First Matter",
              desc: `You've created Prima Materia! The formless essence glows with an inner light. ${deaths} villagers starved while you consumed their food. Those who remain look at you with hollow eyes.`,
              choices: () => [
                { desc: "They don't understand what I've achieved" },
              ],
            });
          },
        },
        {
          desc: "Not yet",
          effects: () => {},
        },
      ];
    },
  };
}

function createFinalTransmutationChoice(
  event: Event_AlchemicalObsession,
): ChoiceEvent {
  return {
    id: "alchemy_final_transmutation",
    title: "The Final Transmutation",
    desc: `After ${event.phase.yearsActive} years of obsessive research, countless deaths, and your own declining health, you stand at the precipice. The final transmutation to create the Philosopher's Stone. But the texts are clear - there is a price. The alchemist must join with the Stone. Will you take the final step?`,
    choices: (gs) => {
      return [
        {
          desc: "Create the Philosopher's Stone (10 Prima Materia, 5 Sulfur, 5 Mercury)",
          requirements: [
            { type: "item", data: "Prima Materia", num: 10, consume: true },
            { type: "item", data: "Sulfur", num: 5, consume: true },
            { type: "item", data: "Mercury", num: 5, consume: true },
          ],
          effects: (gs) => {
            const subevent = event.subEvents.find(
              (se) => se.id === "final_transmutation",
            );
            if (subevent) subevent.completed = true;
            event.phase.finalChoice = true;

            // 50% chance the lord dies in the process
            if (Math.random() < 0.5) {
              gs.choiceEvents.push({
                id: "alchemy_lord_dies",
                title: "The Ultimate Price",
                desc: "The transmutation succeeds! The Philosopher's Stone materializes in a burst of blinding light. But as it forms, you feel your life force being drawn into it. You collapse, your body dissolving into golden light. You achieved your life's work, but paid with your life itself.",
                choices: () => [{ desc: "..." }],
              });

              // Create the stone
              gs.inventory["Philosopher's Stone"] =
                (gs.inventory["Philosopher's Stone"] || 0) + 1;

              // Kill the lord
              if (gs.lord) {
                killLord("Transumation into Philosopher's Stone", gs);
              }
            } else {
              // Lord survives but is forever changed
              gs.choiceEvents.push({
                id: "alchemy_lord_survives",
                title: "The Stone is Complete",
                desc: "The Philosopher's Stone lies before you, pulsing with impossible light. You've done it. But at what cost? Your body is ravaged, your mind fractured. The villagers fear and hate you. Yet you hold in your hands the culmination of the Great Work.",
                choices: () => [{ desc: "It was worth everything..." }],
              });

              // Create the stone
              gs.inventory["Philosopher's Stone"] =
                (gs.inventory["Philosopher's Stone"] || 0) + 1;

              // Permanently reduce lord stats to 1
              if (gs.lord) {
                gs.lord.stats.str = 1;
                gs.lord.stats.dex = 1;
              }

              // Complete goal
              if (gs.lord && gs.lord.goal.name === "Discover Alchemy") {
                gs.lord.goal.effect(gs);
              }
            }

            gs.village.trust = Math.max(0, gs.village.trust - 200);
          },
        },
        {
          desc: "I cannot do this. The price is too high.",
          effects: (gs) => {
            event.phase.finalChoice = true;

            gs.choiceEvents.push({
              id: "alchemy_final_abandoned",
              title: "The Long Walk Away",
              desc: `After ${event.phase.yearsActive} years, you step away from the Grand Athanor. The Prima Materia dissolves. Your life's work remains incomplete. Perhaps that is for the best.`,
              choices: () => [{ desc: "Some doors should remain closed" }],
            });

            gs.village.trust = Math.min(1000, gs.village.trust + 20);
          },
        },
      ];
    },
  };
}

// ===== NOTIFICATION EVENTS =====

function createToxicityDeathNotification(victimName: string): ChoiceEvent {
  return {
    id: "alchemy_toxicity_death",
    title: "Death by Fumes",
    desc: `${victimName} has died from toxic exposure in the alchemical operations. Their lungs were filled with mercury vapor.`,
    choices: () => [{ desc: "A tragic necessity..." }],
  };
}

function createLordHealthDecliningNotification(): ChoiceEvent {
  return {
    id: "alchemy_lord_health_declining",
    title: "Your Health Fails",
    desc: "You've been exposed to toxic substances for years now. Your hands tremble constantly, you cough blood, and your hair is falling out. But the work must continue.",
    choices: () => [{ desc: "I will endure" }],
  };
}

function createStarvationDeathNotification(victimName: string): ChoiceEvent {
  return {
    id: "alchemy_starvation_death",
    title: "Starvation",
    desc: `${victimName} has starved to death. You've been consuming so much food for alchemical processes that there isn't enough for the villagers.`,
    choices: () => [{ desc: "The work requires sacrifice" }],
  };
}

function createPhaseTransitionNotification(phase: number): ChoiceEvent {
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
