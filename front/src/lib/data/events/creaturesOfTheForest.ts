import { killLord, killNPC } from "$lib/simulation/mortality";
import { type GameState } from "$lib/stores";
import { pick } from "$lib/util/rolls";
import { type Choice, type ChoiceEvent } from "../choices";
import { Event, type EventContainer, type SubEvent } from "../events";
import { assignNPCs } from "../npcs";
import { type Project } from "../projects/project";

class Event_CreaturesOfTheForest extends Event {
  constructor(id: string) {
    super(id);
    this.target = "Area";
    this.phase = {
      id: "spotted",
      name: "Creatures Spotted",
      desc: "Something is lurking in the shadows...",
      scoutingCompleted: false,
      preparationCompleted: false,
      deathCount: 0,
      forestWorkRefused: false,
      creatureCount: 0,
      scoutSurvivors: 0,
      huntingCompleted: false,
    };
    this.desc = "Something is lurking in the shadows...";

    // Define subevents
    this.subEvents = [
      {
        id: "scouting",
        title: "Send Scouts",
        desc: "Send 4 workers into the forest for 3 days to gather information about the creatures.",
        completed: false,
        visible: true, // Always visible
        inProgress: false,
        projectKey: "Scouting_COTF",
        createChoiceEvent: (parentEvent) =>
          createScoutingChoiceEvent(parentEvent as Event_CreaturesOfTheForest),
      },
      {
        id: "preparation",
        title: "Prepare Defenses",
        desc: "Gather 20 spears to prepare for a potential attack.",
        completed: false,
        visible: true, // Always visible
        createChoiceEvent: (parentEvent) =>
          createPreparationChoiceEvent(
            parentEvent as Event_CreaturesOfTheForest,
          ),
      },
      {
        id: "hunting",
        title: "Hunt the Creatures",
        desc: "Organize a hunting party to eliminate the creatures.",
        completed: false,
        visible: false, // Only visible after scouting is complete
        inProgress: false,
        createChoiceEvent: (parentEvent) =>
          createHuntingChoiceEvent(parentEvent as Event_CreaturesOfTheForest),
      },
    ];

    this.action = ({ gs }) => {
      if (!gs) return;

      // Daily death chance for forest workers
      if (this.phase.id !== "resolved" && this.phase.id !== "spotted") {
        this.processDailyForestDeaths(gs);
      }

      // Check if scouting project has completed
      const scoutingSubEvent = this.subEvents.find(
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
          if (this.phase.lordLeadingScouting) {
            this.handleLordScoutingCompletion(gs, scoutingSubEvent);
          } else {
            this.handleScoutingCompletion(gs, scoutingSubEvent);
          }
        }
      }

      // Check if hunting project has completed
      const huntingSubEvent = this.subEvents.find((se) => se.id === "hunting");
      if (huntingSubEvent?.inProgress) {
        const huntingArea = gs.areas.find(
          (a) => a.currentProjects["Hunting_COTF"],
        );
        const lordHuntingArea = gs.areas.find(
          (a) => a.currentProjects["Hunting_COTF_Lord"],
        );

        if (!huntingArea && !lordHuntingArea) {
          // Project completed - handle hunting results
          if (this.phase.lordLeadingHunting) {
            this.handleLordHuntingCompletion(gs, huntingSubEvent);
          } else {
            this.handleHuntingCompletion(gs, huntingSubEvent);
          }
        }
      }

      // Check if event is fully resolved
      if (this.phase.huntingCompleted) {
        this.phase = {
          ...this.phase,
          id: "resolved",
          name: "Resolved",
          desc: "The creatures have been eliminated.",
        };
      } else if (this.phase.id === "spotted") {
        // Initial phase - show the warning
        this.phase = {
          ...this.phase,
          id: "warned",
          name: "Warned",
          desc: "Villagers are aware of the danger...",
        };
        gs.choiceEvents.push(phase1(this));
      }
    };

    this.resolved = ({ gs }) => {
      return this.phase.id === "resolved";
    };
  }

  processDailyForestDeaths(gs: GameState) {
    // Base death chance per day (0.5%)
    let deathChance = 0.005;

    // If defenses are prepared, reduce death chance significantly (to 0.1%)
    if (this.phase.preparationCompleted) {
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
        this.phase.deathCount++;
        gs.choiceEvents.push(createDeathNotification(worker.fName));

        // If 5 or more deaths, villagers refuse to work in forest
        if (this.phase.deathCount >= 5 && !this.phase.forestWorkRefused) {
          this.phase.forestWorkRefused = true;
          gs.choiceEvents.push(createWorkRefusalNotification());
        }
      }
    });
  }

  handleScoutingCompletion(gs: GameState, scoutingSubEvent: SubEvent) {
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
        this.phase.deathCount++;
      }
    }

    this.phase.scoutSurvivors = survivors;

    if (survivors === 0) {
      // All scouts died - can retry scouting
      scoutingSubEvent.completed = false;
      scoutingSubEvent.inProgress = false;
      gs.choiceEvents.push(createScoutingFailureNotification());
    } else {
      // At least one survivor - reveal creature count
      scoutingSubEvent.completed = true;
      scoutingSubEvent.inProgress = false;
      this.phase.scoutingCompleted = true;

      // Random creature count between 3 and 12
      this.phase.creatureCount = Math.floor(Math.random() * 10) + 3;

      gs.choiceEvents.push(
        createScoutingSuccessNotification(
          survivors,
          deaths,
          this.phase.creatureCount,
        ),
      );

      // Update hunting subevent description with creature count and make it visible
      const huntingSubEvent = this.subEvents.find((se) => se.id === "hunting");
      if (huntingSubEvent) {
        huntingSubEvent.desc = `${this.phase.creatureCount} creatures have been spotted. Organize a hunting party to eliminate them.`;
        huntingSubEvent.visible = true; // Now visible after successful scouting
      }
    }

    // Check for work refusal threshold
    if (this.phase.deathCount >= 5 && !this.phase.forestWorkRefused) {
      this.phase.forestWorkRefused = true;
      gs.choiceEvents.push(createWorkRefusalNotification());
    }
  }

  handleHuntingCompletion(gs: GameState, huntingSubEvent: SubEvent) {
    // Find the completed hunting area to get strategy data
    const huntingArea = gs.areas.find((a) => {
      const project = a.currentProjects["Hunting_COTF"];
      return project !== undefined;
    });

    // Default strategy values if we can't find the project
    let deathChance = 0.2;
    let failureChance = 0.15;
    let workerCount = 6;

    // Try to get strategy data from a recently completed project
    // Since the project is already removed, we'll use stored phase data
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
          this.phase.deathCount++;
        }
      }

      // Reset hunting subevent so they can try again
      huntingSubEvent.completed = false;
      huntingSubEvent.inProgress = false;

      gs.choiceEvents.push(createHuntingFailureNotification(workerCount));

      // Check for work refusal threshold
      if (this.phase.deathCount >= 5 && !this.phase.forestWorkRefused) {
        this.phase.forestWorkRefused = true;
        gs.choiceEvents.push(createWorkRefusalNotification());
      }
    } else {
      // Mission succeeded - but some hunters may still die
      let deaths = 0;
      for (let i = 0; i < workerCount; i++) {
        if (Math.random() < deathChance) {
          const victim = pick(gs.npcs);
          if (victim) {
            killNPC(victim, "Hunting Creatures", gs);
            this.phase.deathCount++;
            deaths++;
          }
        }
      }

      // Mark as completed
      huntingSubEvent.completed = true;
      huntingSubEvent.inProgress = false;
      this.phase.huntingCompleted = true;

      gs.choiceEvents.push(
        createHuntingSuccessNotification(workerCount - deaths, deaths),
      );

      // Check for work refusal threshold even on success
      if (
        deaths > 0 &&
        this.phase.deathCount >= 5 &&
        !this.phase.forestWorkRefused
      ) {
        this.phase.forestWorkRefused = true;
        gs.choiceEvents.push(createWorkRefusalNotification());
      }
    }
  }
}
export const event_CreaturesOfTheForest = {
  id: "Creatures of the Forest",
  condition: { type: "Time", mtth: 3 },
  multiple: false,
  event: Event_CreaturesOfTheForest,
} as const satisfies EventContainer;
function phase1(e: Event_CreaturesOfTheForest): ChoiceEvent {
  return {
    id: "cotf_phase1",
    title: "Creatures spotted!",
    desc: "Villagers have noticed shadows lurking in the shadow",
    choices: (gs) => {
      return [
        {
          desc: "Understood. Something will be done",
          effects: (gs) => {
            //e.phase = 3;
          },
        },
      ];
    },
  };
}

// Notification choice events
function createDeathNotification(victimName: string): ChoiceEvent {
  return {
    id: "cotf_death",
    title: "Villager Lost to Creatures",
    desc: `${victimName} was found dead in the forest, torn apart by the creatures...`,
    choices: () => [{ desc: "This is terrible..." }],
  };
}

function createWorkRefusalNotification(): ChoiceEvent {
  return {
    id: "cotf_work_refusal",
    title: "Villagers Refuse Forest Work",
    desc: "After so many deaths, the villagers are terrified. They refuse to work in the forest until the creatures are eliminated.",
    choices: () => [{ desc: "We must deal with these creatures" }],
  };
}

function createScoutingFailureNotification(): ChoiceEvent {
  return {
    id: "cotf_scouting_failure",
    title: "Scouting Mission Failed",
    desc: "All the scouts perished in the forest. Their screams echoed through the trees... We must try again.",
    choices: () => [{ desc: "May they rest in peace" }],
  };
}

function createScoutingSuccessNotification(
  survivors: number,
  deaths: number,
  creatureCount: number,
): ChoiceEvent {
  const deathText =
    deaths > 0
      ? ` ${deaths} scout${deaths > 1 ? "s" : ""} did not return.`
      : "";
  return {
    id: "cotf_scouting_success",
    title: "Scouts Return",
    desc: `${survivors} scout${survivors > 1 ? "s" : ""} returned from the forest.${deathText} They report approximately ${creatureCount} creatures lurking in the shadows.`,
    choices: () => [{ desc: "Now we know what we're dealing with" }],
  };
}

function createHuntingSuccessNotification(
  survivors: number,
  deaths: number,
): ChoiceEvent {
  const deathText =
    deaths > 0
      ? ` However, ${deaths} hunter${deaths > 1 ? "s" : ""} fell in battle.`
      : " No one was lost!";
  return {
    id: "cotf_hunting_success",
    title: "Creatures Eliminated",
    desc: `The hunting party returned victorious! The creatures have been slain.${deathText} The forest is safe once again.`,
    choices: () => [
      { desc: deaths > 0 ? "They died heroes" : "Excellent work!" },
    ],
  };
}

function createHuntingFailureNotification(hunterCount: number): ChoiceEvent {
  return {
    id: "cotf_hunting_failure",
    title: "Hunting Mission Failed",
    desc: `The hunting party was overwhelmed by the creatures. All ${hunterCount} hunters perished. We must regroup and try again.`,
    choices: () => [{ desc: "This is a disaster..." }],
  };
}

// Scouting subevent choice
function createScoutingChoiceEvent(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  return {
    id: "cotf_scouting",
    title: "Send Scouts",
    desc: "Do you want to send 4 workers into the forest for 3 days to scout the creatures?",
    choices: (gs) => {
      const availableWorkers = gs.npcs.filter(
        (npc) =>
          npc.job.title === "None" &&
          npc.age >= 16 &&
          !gs.dailyWorkerActivity.has(npc.id),
      );

      const choices: Choice[] = [
        {
          desc: "Send the scouts",
          requirements: [{ type: "pop", min: 16, num: 4, consume: false }],
          effects: (gs) => {
            // Find a forest area or use the first area
            const scoutingArea =
              gs.areas.find((a) => a.type === "Forest") || gs.areas[0];
            if (!scoutingArea) return;

            // Create the scouting project
            const scoutingProject: Project = {
              type: "Scouting_COTF",
              currentPhase: 1,

              dailyProgress: 0,
              phases: [
                {
                  name: "Scouting",
                  manDaysRequired: 12, // 4 workers * 3 days
                  progressPercent: 0,
                  maxDailyProgress: 33.4,
                  requirements: [],
                  stuck: true, // Workers can't be reassigned
                  occupationTitle: "Scout",
                },
              ],
              outputs: [],
              workers: new Set<number>(),
              requirements: [],
            };

            scoutingArea.currentProjects["Scouting_COTF"] = scoutingProject;

            // Assign 4 workers to the project using the assignNPCs function
            assignNPCs(gs, scoutingProject, 100, 4);

            // Mark subevent as in progress
            const scoutingSubEvent = event.subEvents.find(
              (se) => se.id === "scouting",
            );
            if (scoutingSubEvent) {
              scoutingSubEvent.inProgress = true;
            }
            event.phase.scoutingStarted = true;
          },
        },
      ];

      // Add lord-led scouting option if lord has Fighter trait
      if (gs.lord?.traits.has("Fighter")) {
        choices.push({
          desc: "Lead the scouting mission personally (6 days, no villager deaths)",
          requirements: [{ type: "pop", min: 16, num: 2, consume: false }],
          effects: (gs) => {
            // Find a forest area or use the first area
            const scoutingArea =
              gs.areas.find((a) => a.type === "Forest") || gs.areas[0];
            if (!scoutingArea) return;

            // Create the lord-led scouting project (double duration)
            const scoutingProject: Project = {
              type: "Scouting_COTF_Lord",
              currentPhase: 1,
              dailyProgress: 0,
              phases: [
                {
                  name: "Scouting (Lord-Led)",
                  manDaysRequired: 12, // 2 workers * 6 days
                  progressPercent: 0,
                  maxDailyProgress: 16.67,
                  requirements: [],
                  stuck: true,
                  occupationTitle: "Scout",
                },
              ],
              outputs: [],
              workers: new Set<number>(),
              requirements: [],
            };

            scoutingArea.currentProjects["Scouting_COTF_Lord"] = scoutingProject;

            // Assign 2 workers to the project
            assignNPCs(gs, scoutingProject, 100, 2);

            // Mark subevent as in progress
            const scoutingSubEvent = event.subEvents.find(
              (se) => se.id === "scouting",
            );
            if (scoutingSubEvent) {
              scoutingSubEvent.inProgress = true;
            }
            event.phase.scoutingStarted = true;
            event.phase.lordLeadingScouting = true;
            event.phase.lordScoutingProgress = 0;

            // Start the interactive scouting experience
            gs.choiceEvents.push(createLordScoutingDay1Event(event));
          },
        } as Choice);
      }

      choices.push({
        desc: "Not now",
        effects: () => {},
      });

      return choices;
    },
  };
}

// Preparation subevent choice
function createPreparationChoiceEvent(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  return {
    id: "cotf_preparation",
    title: "Prepare Defenses",
    desc: "Do you want to use 20 spears to prepare defenses against the creatures?",
    choices: (gs) => {
      return [
        {
          desc: "Use 20 spears",
          requirements: [
            {
              type: "item",
              data: "Spears",
              num: 20,
              consume: true,
            },
          ],
          effects: (gs) => {
            const preparationSubEvent = event.subEvents.find(
              (se) => se.id === "preparation",
            );
            if (preparationSubEvent) {
              preparationSubEvent.completed = true;
              event.phase.preparationCompleted = true;
            }
          },
        },
        {
          desc: "Not now",
          effects: () => {},
        },
      ];
    },
  };
}

// Hunting subevent choice
function createHuntingChoiceEvent(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  const creatureCount = event.phase.creatureCount || 0;

  return {
    id: "cotf_hunting",
    title: "Hunt the Creatures",
    desc: `You've identified ${creatureCount} creatures in the forest. Choose your hunting strategy:`,
    choices: (gs) => {
      // Only show hunting options if scouting is completed
      if (!event.phase.scoutingCompleted) {
        return [
          {
            desc: "We need to scout first",
            effects: () => {},
          },
        ];
      }

      const strategies = [
        {
          name: "Small Strike Team",
          desc: `Send 3 hunters with 10 spears (2 days) - High risk, quick mission`,
          workers: 3,
          days: 2,
          spears: 10,
          deathChance: 0.4, // 40% chance per hunter
          failureChance: 0.3, // 30% chance mission fails entirely
        },
        {
          name: "Balanced Hunt",
          desc: `Send 6 hunters with 20 spears (4 days) - Moderate risk`,
          workers: 6,
          days: 4,
          spears: 20,
          deathChance: 0.2, // 20% chance per hunter
          failureChance: 0.15, // 15% chance mission fails
        },
        {
          name: "Large War Party",
          desc: `Send 12 hunters with 40 spears (7 days) - Low risk, long mission`,
          workers: 12,
          days: 7,
          spears: 40,
          deathChance: 0.1, // 10% chance per hunter
          failureChance: 0.05, // 5% chance mission fails
        },
      ];

      const choices: Choice[] = strategies.map((strategy) => ({
        desc: `${strategy.name}: ${strategy.workers} workers, ${strategy.spears} spears, ${strategy.days} days`,
        requirements: [
          { type: "pop", min: 16, num: strategy.workers, consume: false },
          {
            type: "item",
            data: "Spears",
            num: strategy.spears,
            consume: false,
          },
        ],
        effects: (gs: GameState) => {
          // Find a forest area or use the first area
          const huntingArea =
            gs.areas.find((a) => a.type === "Forest") || gs.areas[0];
          if (!huntingArea) return;

          // Create the hunting project
          const huntingProject: Project = {
            type: "Hunting_COTF",
            currentPhase: 1,
            dailyProgress: 0,
            phases: [
              {
                name: `Hunting (${strategy.name})`,
                manDaysRequired: strategy.workers * strategy.days,
                progressPercent: 0,
                maxDailyProgress: 100 / strategy.days,
                requirements: [],
                stuck: true,
                occupationTitle: "Hunter",
              },
            ],
            outputs: [],
            workers: new Set<number>(),
            requirements: [],
          };

          // Store strategy info in the project for later use
          (huntingProject as any).strategyData = {
            deathChance: strategy.deathChance,
            failureChance: strategy.failureChance,
            workerCount: strategy.workers,
          };

          huntingArea.currentProjects["Hunting_COTF"] = huntingProject;

          // Assign workers to the project
          assignNPCs(gs, huntingProject, 100, strategy.workers);

          // Mark subevent as in progress
          const huntingSubEvent = event.subEvents.find(
            (se) => se.id === "hunting",
          );
          if (huntingSubEvent) {
            huntingSubEvent.inProgress = true;
          }
        },
      }));

      // Add lord-led hunting option if lord has Fighter trait
      if (gs.lord?.traits.has("Fighter")) {
        choices.push({
          desc: "Lead the hunting party personally (8 days, no villager deaths, but risky for you)",
          requirements: [
            { type: "pop", min: 16, num: 3, consume: false },
            {
              type: "item",
              data: "Spears",
              num: 15,
              consume: false,
            },
          ],
          effects: (gs: GameState) => {
            // Find a forest area or use the first area
            const huntingArea =
              gs.areas.find((a) => a.type === "Forest") || gs.areas[0];
            if (!huntingArea) return;

            // Create the lord-led hunting project (double duration of balanced hunt)
            const huntingProject: Project = {
              type: "Hunting_COTF_Lord",
              currentPhase: 1,
              dailyProgress: 0,
              phases: [
                {
                  name: "Hunting (Lord-Led)",
                  manDaysRequired: 24, // 3 workers * 8 days
                  progressPercent: 0,
                  maxDailyProgress: 12.5,
                  requirements: [],
                  stuck: true,
                  occupationTitle: "Hunter",
                },
              ],
              outputs: [],
              workers: new Set<number>(),
              requirements: [],
            };

            huntingArea.currentProjects["Hunting_COTF_Lord"] = huntingProject;

            // Assign 3 workers to the project
            assignNPCs(gs, huntingProject, 100, 3);

            // Mark subevent as in progress
            const huntingSubEvent = event.subEvents.find(
              (se) => se.id === "hunting",
            );
            if (huntingSubEvent) {
              huntingSubEvent.inProgress = true;
            }
            event.phase.lordLeadingHunting = true;
            event.phase.lordHuntingProgress = 0;

            // Start the interactive hunting experience
            gs.choiceEvents.push(createLordHuntingDay1Event(event));
          },
        } as Choice);
      }

      choices.push({
        desc: "Not now",
        effects: () => {},
      } as any);

      return choices;
    },
  };
}

// ===== LORD-LED SCOUTING =====

// Handler for lord-led scouting completion
Event_CreaturesOfTheForest.prototype.handleLordScoutingCompletion = function(
  gs: GameState,
  scoutingSubEvent: SubEvent,
) {
  if (!gs.lord) return;

  // Calculate lord death chance based on stats
  // Base 30% death chance, reduced by STR and DEX
  const str = gs.lord.stats.str;
  const dex = gs.lord.stats.dex;
  const statBonus = (str + dex) / 14; // 0 to 1 scale assuming 7 is max per stat
  const lordDeathChance = Math.max(0.05, 0.3 - statBonus * 0.25); // 5% to 30%

  if (Math.random() < lordDeathChance) {
    // Lord died during scouting
    scoutingSubEvent.completed = false;
    scoutingSubEvent.inProgress = false;
    gs.choiceEvents.push(createLordScoutingDeathNotification());
    killLord("Killed by forest creatures", gs);
    return;
  }

  // Lord survived - always successful, reveal creature count
  scoutingSubEvent.completed = true;
  scoutingSubEvent.inProgress = false;
  this.phase.scoutingCompleted = true;

  // Random creature count between 3 and 12
  this.phase.creatureCount = Math.floor(Math.random() * 10) + 3;

  gs.choiceEvents.push(
    createLordScoutingSuccessNotification(this.phase.creatureCount),
  );

  // Update hunting subevent
  const huntingSubEvent = this.subEvents.find((se) => se.id === "hunting");
  if (huntingSubEvent) {
    huntingSubEvent.desc = `${this.phase.creatureCount} creatures have been spotted. Organize a hunting party to eliminate them.`;
    huntingSubEvent.visible = true;
  }
};

function createLordScoutingDay1Event(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  return {
    id: "cotf_lord_scout_day1",
    title: "Into the Forest",
    desc: "You lead your small band of scouts into the dark forest. The trees loom overhead, their branches creating shadows that seem to move. Do you proceed cautiously or quickly?",
    choices: (gs) => {
      return [
        {
          desc: "Move cautiously, watching for signs (improves survival)",
          effects: (gs) => {
            event.phase.lordScoutingProgress += 1;
            // Reduce death chance slightly
            if (gs.lord) {
              gs.lord.stats.dex = Math.min(10, gs.lord.stats.dex + 0.5);
            }
          },
        },
        {
          desc: "Move quickly to cover more ground (riskier)",
          effects: (gs) => {
            event.phase.lordScoutingProgress += 1;
          },
        },
      ];
    },
  };
}

function createLordScoutingDeathNotification(): ChoiceEvent {
  return {
    id: "cotf_lord_scout_death",
    title: "A Lord Falls",
    desc: "The creatures ambushed your scouting party in the deep forest. Despite your best efforts, you were overwhelmed. Your companions barely escaped to tell the tale of your brave but fatal stand.",
    choices: () => [{ desc: "..." }],
  };
}

function createLordScoutingSuccessNotification(
  creatureCount: number,
): ChoiceEvent {
  return {
    id: "cotf_lord_scout_success",
    title: "The Lord Returns",
    desc: `After days in the forest, you return with crucial intelligence. You've identified approximately ${creatureCount} creatures - large, wolf-like beasts with unnatural intelligence. No villagers died under your leadership.`,
    choices: () => [{ desc: "Now we can plan our attack" }],
  };
}

// ===== LORD-LED HUNTING =====

// Handler for lord-led hunting completion
Event_CreaturesOfTheForest.prototype.handleLordHuntingCompletion = function(
  gs: GameState,
  huntingSubEvent: SubEvent,
) {
  if (!gs.lord) return;

  // Calculate lord death chance based on stats
  // Base 35% death chance (hunting is more dangerous than scouting)
  const str = gs.lord.stats.str;
  const dex = gs.lord.stats.dex;
  const statBonus = (str + dex) / 14; // 0 to 1 scale assuming 7 is max per stat

  // STR matters more in combat, DEX matters for avoiding attacks
  const strWeight = 0.6;
  const dexWeight = 0.4;
  const combatStatBonus = (str / 7) * strWeight + (dex / 7) * dexWeight;

  const lordDeathChance = Math.max(0.08, 0.35 - combatStatBonus * 0.27); // 8% to 35%

  if (Math.random() < lordDeathChance) {
    // Lord died during hunting
    huntingSubEvent.completed = false;
    huntingSubEvent.inProgress = false;
    gs.choiceEvents.push(createLordHuntingDeathNotification());
    killLord("Killed by forest creatures", gs);
    return;
  }

  // Lord survived - always successful, no villager deaths
  huntingSubEvent.completed = true;
  huntingSubEvent.inProgress = false;
  this.phase.huntingCompleted = true;

  gs.choiceEvents.push(createLordHuntingSuccessNotification());
};

function createLordHuntingDay1Event(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  const creatureCount = event.phase.creatureCount || 0;
  return {
    id: "cotf_lord_hunt_day1",
    title: "The Hunt Begins",
    desc: `You gather your hunting party - 3 skilled villagers and yourself, armed with spears. The creatures number ${creatureCount}, and they're dangerous. How do you approach the hunt?`,
    choices: (gs) => {
      return [
        {
          desc: "Set traps and ambush points (safer, but takes longer)",
          effects: (gs) => {
            event.phase.lordHuntingProgress += 1;
            // Reduce death chance slightly
            if (gs.lord) {
              gs.lord.stats.str = Math.min(10, gs.lord.stats.str + 0.3);
            }
            // Add follow-up event
            setTimeout(() => {
              if (gs.areas.some((a) => a.currentProjects["Hunting_COTF_Lord"])) {
                gs.choiceEvents.push(createLordHuntingMidEvent(event));
              }
            }, 0);
          },
        },
        {
          desc: "Track and engage directly (faster but riskier)",
          effects: (gs) => {
            event.phase.lordHuntingProgress += 1;
            // No stat bonus
            // Add follow-up event
            setTimeout(() => {
              if (gs.areas.some((a) => a.currentProjects["Hunting_COTF_Lord"])) {
                gs.choiceEvents.push(createLordHuntingMidEvent(event));
              }
            }, 0);
          },
        },
      ];
    },
  };
}

function createLordHuntingMidEvent(
  event: Event_CreaturesOfTheForest,
): ChoiceEvent {
  return {
    id: "cotf_lord_hunt_mid",
    title: "First Blood",
    desc: "You've encountered a pack of the creatures. They're larger than wolves, with glowing eyes and unnaturally sharp claws. One lunges at you!",
    choices: (gs) => {
      return [
        {
          desc: "Use your spear defensively, wait for an opening",
          effects: (gs) => {
            event.phase.lordHuntingProgress += 1;
            if (gs.lord) {
              gs.lord.stats.dex = Math.min(10, gs.lord.stats.dex + 0.3);
            }
          },
        },
        {
          desc: "Attack aggressively to intimidate the pack",
          effects: (gs) => {
            event.phase.lordHuntingProgress += 1;
            if (gs.lord) {
              gs.lord.stats.str = Math.min(10, gs.lord.stats.str + 0.3);
            }
          },
        },
      ];
    },
  };
}

function createLordHuntingDeathNotification(): ChoiceEvent {
  return {
    id: "cotf_lord_hunt_death",
    title: "A Lord Falls in Battle",
    desc: "The creatures proved too numerous and too vicious. In a desperate last stand, you gave your life so your companions could escape. They returned to tell of your bravery, but the village mourns the loss of their leader.",
    choices: () => [{ desc: "..." }],
  };
}

function createLordHuntingSuccessNotification(): ChoiceEvent {
  return {
    id: "cotf_lord_hunt_success",
    title: "Victorious Return",
    desc: "After days of fierce combat, you return bloodied but victorious. Every creature has been slain. Your companions speak in awe of your combat prowess, and not a single villager fell under your command. The forest is safe once more.",
    choices: () => [{ desc: "The deed is done" }],
  };
}
