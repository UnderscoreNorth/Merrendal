# V2 JSON-Serializable Architecture

This document describes the new JSON-serializable architecture for events, projects, and choices.

## Overview

The V2 architecture redesigns the event, project, and choice systems to be fully JSON-serializable. This enables:

- **Save/Load**: Properly save and restore complete game state
- **Hot Reloading**: Reload event data without restarting the game
- **Debugging**: Inspect game state easily with JSON tools
- **Modding**: Create custom events in JSON files
- **Network Play**: Sync game state over network (future)

## Key Changes

### 1. Handler Registry Pattern

Instead of storing function references directly in data structures, we now use **string handler IDs** that map to functions in a central registry.

**Before (V1):**
```typescript
{
  action: (gs) => { /* code */ },
  effects: (gs) => { /* code */ }
}
```

**After (V2):**
```typescript
{
  actionHandlerId: "my_event_action",
  effectHandlerId: "my_effect"
}
```

### 2. Data vs Logic Separation

- **Data structures** (EventData, ProjectData, ChoiceData) are pure JSON-serializable objects
- **Logic** is registered separately in handler registries
- **Templates** define the structure of events/projects
- **Instances** are runtime copies created from templates

### 3. File Structure

```
/lib/data/
  ├── eventsV2.ts              # New event data types
  ├── projects/
  │   └── projectV2.ts         # New project data types
  ├── handlers/
  │   └── registry.ts          # Handler registration system
  ├── managers/
  │   └── EventManager.ts      # Event lifecycle management
  └── events/
      ├── creaturesOfTheForestV2.ts  # Example V2 event
      └── ...
```

## Core Concepts

### EventTemplate

Defines the blueprint for an event:

```typescript
const myEventTemplate: EventTemplate = {
  id: "my_event",
  target: "Area",
  desc: "Event description",
  initialPhase: { id: "start", name: "Starting", desc: "..." },
  subEvents: [
    {
      id: "subevent1",
      title: "Do Something",
      desc: "...",
      choiceGeneratorId: "my_subevent_choices"
    }
  ],
  actionHandlerId: "my_event_action",
  resolvedHandlerId: "my_event_resolved",
  condition: { type: "Time", mtth: 3 },
  multiple: false
};
```

### EventData

Runtime instance of an event (JSON-serializable):

```typescript
{
  id: "my_event",
  instanceId: "my_event_123456",
  target: "Area",
  desc: "Event description",
  phase: { id: "start", name: "Starting", desc: "..." },
  subEvents: [...],
  actionHandlerId: "my_event_action",
  resolvedHandlerId: "my_event_resolved",
  customData: { /* any custom props */ }
}
```

### Handler Registration

Register handlers before using them:

```typescript
import {
  registerEventActionHandler,
  registerEffectHandler
} from "../handlers/registry";

// Register an event action
registerEventActionHandler("my_event_action", (eventData, gs) => {
  // Daily action logic
  console.log("Event action running:", eventData.id);
});

// Register an effect
registerEffectHandler("my_effect", (eventData, gs) => {
  // Effect logic
  gs.inventory.Gold += 100;
});
```

### EventManager

Manages the event lifecycle:

```typescript
import { eventManager } from "../managers/EventManager";

// Register templates
eventManager.registerEventTemplate(myEventTemplate);

// Trigger events
const event = eventManager.triggerEvent("my_event", gameState);

// Process daily actions
eventManager.processEvents(gameState);

// Check event triggers
eventManager.processEventTriggers(gameState);
```

## Migration Guide

### Converting V1 Events to V2

1. **Extract the event class into a template:**

```typescript
// V1
class Event_MyEvent extends Event {
  constructor(id: string) {
    super(id);
    this.action = () => { /* ... */ };
    this.resolved = () => { /* ... */ };
  }
}

// V2
const myEventTemplate: EventTemplate = {
  id: "my_event",
  actionHandlerId: "my_event_action",
  resolvedHandlerId: "my_event_resolved",
  // ...
};
```

2. **Register handlers:**

```typescript
registerEventActionHandler("my_event_action", (eventData, gs) => {
  // Move action logic here
});

registerEventResolvedHandler("my_event_resolved", (eventData, gs) => {
  // Move resolved logic here
  return eventData.phase.id === "done";
});
```

3. **Convert choice functions to handlers:**

```typescript
// V1
createChoiceEvent: (parentEvent) => ({
  id: "my_choice",
  choices: (gs) => [
    {
      desc: "Option 1",
      effects: (gs) => { /* ... */ }
    }
  ]
})

// V2
choiceGeneratorId: "my_choice_generator"

// Register separately:
registerChoiceGeneratorHandler("my_choice_generator", (eventData, gs) => {
  return [
    {
      desc: "Option 1",
      effectHandlerId: "my_option1_effect"
    }
  ];
});

registerEffectHandler("my_option1_effect", (eventData, gs) => {
  // Move effect logic here
});
```

4. **Store custom data in customData:**

```typescript
// V1 - stored in class properties
this.deathCount = 0;
this.creatureCount = 0;

// V2 - stored in customData
eventData.customData.deathCount = 0;
eventData.customData.creatureCount = 0;
```

### Converting Projects to V2

1. **Use ProjectTemplate instead of constructor functions:**

```typescript
// V1
const myProject: Project = {
  type: "My_Project",
  currentPhase: 1,
  phases: [...],
  outputs: [...],
  workers: new Set<number>(),
  // ...
};

// V2
const myProjectTemplate: ProjectTemplate = {
  type: "My_Project",
  phases: [...],
  outputs: [...],
  requirements: [...]
};

// Create instance:
const project = createProjectInstance(myProjectTemplate);
```

2. **Replace Set with Array for workers:**

```typescript
// V1
project.workers.add(123);

// V2
addWorkerToProject(project, 123);
```

3. **Store strategy data in customData:**

```typescript
// V1
(project as any).strategyData = { ... };

// V2
project.customData.strategyData = { ... };
```

## Best Practices

### 1. Handler Naming Convention

Use descriptive, namespaced handler IDs:

```typescript
// Good
"cotf_daily_action"
"cotf_scouting_choices"
"cotf_start_scouting_effect"

// Bad
"action1"
"choices"
"effect"
```

### 2. CustomData Usage

Store all event-specific state in `customData`:

```typescript
eventData.customData = {
  deathCount: 0,
  phase2Started: false,
  playerChoices: [],
  // ... any custom properties
};
```

### 3. Handler Organization

Keep handlers close to their templates:

```typescript
// myEvent.ts
export const myEventTemplate = { ... };

// Register handlers immediately after
registerEventActionHandler("my_event_action", (eventData, gs) => {
  // ...
});
```

### 4. Type Safety

Use proper types for customData:

```typescript
interface MyEventCustomData {
  deathCount: number;
  creatureCount: number;
  completed: boolean;
}

// In handler:
const customData = eventData.customData as MyEventCustomData;
```

## JSON Serialization

### Saving Game State

```typescript
import { serializeEvent, serializeProject } from "./eventsV2";

// Serialize a single event
const eventJson = serializeEvent(eventData);

// Save to file/localStorage
localStorage.setItem("gameEvents", JSON.stringify(gameState.events));
```

### Loading Game State

```typescript
import { deserializeEvent } from "./eventsV2";

// Load from file/localStorage
const eventsJson = localStorage.getItem("gameEvents");
const events = JSON.parse(eventsJson);

gameState.events = events; // Already EventData[]
```

## Migration Status

### Completed
- ✅ Handler registry system
- ✅ V2 event types (eventsV2.ts)
- ✅ V2 project types (projectV2.ts)
- ✅ EventManager
- ✅ Example: creaturesOfTheForestV2.ts

### TODO
- ⬜ Migrate all existing events to V2
- ⬜ Update GameState to use V2 types
- ⬜ Update UI components to work with V2
- ⬜ Implement choice generator handlers for all events
- ⬜ Update time.ts to use EventManager
- ⬜ Add JSON save/load functionality
- ⬜ Create migration tool for old saves
- ⬜ Add hot-reload support
- ⬜ Create JSON schema for event templates
- ⬜ Build event editor tool (optional)

## Testing

Test that events are serializable:

```typescript
import { serializeEvent, deserializeEvent } from "./eventsV2";

// Create event
const event = eventManager.createEvent("my_event");

// Serialize
const json = serializeEvent(event);

// Deserialize
const restored = deserializeEvent(json);

// Should be equivalent
console.assert(restored.id === event.id);
console.assert(JSON.stringify(restored) === JSON.stringify(event));
```

## Performance Considerations

- Handler lookups are O(1) via Map
- Serialization is fast (native JSON)
- No circular references in data structures
- CustomData can grow unbounded (monitor size)

## Backward Compatibility

The old (V1) and new (V2) systems can coexist during migration:

1. Keep old event system running
2. Gradually migrate events to V2
3. Once all migrated, remove V1 code
4. Update save format version

## Questions?

See example implementation in `creaturesOfTheForestV2.ts` for a complete working example.
