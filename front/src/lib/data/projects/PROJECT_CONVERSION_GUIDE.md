# Project V2 Conversion Guide

This guide explains how to convert projects from V1 (class-based) to V2 (JSON-serializable).

## Example: Farm Wheat Project

### V1 Version (Old)
```typescript
export class FarmWheatProject implements Project {
  type = "Farm Wheat";
  currentPhase = 1;
  phases: ProjectPhase[];
  outputs: ProjectOutput[];
  workers: Set<number> = new Set(); // ❌ Not JSON-serializable
  requirements: Requirement[];
  dailyProgress = 0;

  constructor({ area }: { area: Area }) {
    // Direct function references ❌
    this.phases[0].outputModifiers = [
      {
        condition: () => true,
        modifier: () => this.phases[0]?.progressPercent / 100 || 0,
        description: "Planting progress affects output",
      },
    ];
  }
}
```

### V2 Version (New)
```typescript
// Register handlers
registerOutputConditionHandler("wheat_planting_condition", (gs, data) => {
  return true;
});

registerOutputModifierHandler("wheat_planting_modifier", (gs, data) => {
  const projectData = data as ProjectData;
  return projectData.phases[0]?.progressPercent / 100 || 0;
});

// Create template factory
export function createFarmWheatTemplate(area: Area): ProjectTemplate {
  return {
    type: "Farm Wheat",
    phases: [
      {
        name: "Planting",
        manDaysRequired: (area.acres * 50) / 5,
        progressPercent: 0,
        outputModifiers: [
          {
            conditionHandlerId: "wheat_planting_condition", // ✅ String ID
            modifierHandlerId: "wheat_planting_modifier",   // ✅ String ID
            description: "Planting progress affects output",
          },
        ],
        // ...
      },
    ],
    outputs: [
      {
        type: "items",
        data: { Wheat: area.acres * 10 },
      },
    ],
    requirements: [
      { type: "season", data: "Spring", consume: false, not: false },
      { type: "building", data: "Farm House", consume: false, not: false },
    ],
    customData: {
      areaId: area.areaID,
      acres: area.acres,
    },
  };
}
```

## Key Changes

### 1. Workers: Set → Array
```typescript
// V1
workers: Set<number> = new Set();

// V2
workers: number[] = [];
```

### 2. Output Modifiers: Functions → Handler IDs
```typescript
// V1 - Direct function references
outputModifiers: [
  {
    condition: () => true,
    modifier: () => someCalculation(),
    description: "...",
  }
]

// V2 - String handler IDs
outputModifiers: [
  {
    conditionHandlerId: "my_condition",
    modifierHandlerId: "my_modifier",
    description: "...",
    conditionData: {...}, // Optional data for handler
    modifierData: {...},  // Optional data for handler
  }
]

// Register handlers
registerOutputConditionHandler("my_condition", (gs, data) => {
  return true;
});

registerOutputModifierHandler("my_modifier", (gs, data) => {
  return someCalculation();
});
```

### 3. Requirements Format
```typescript
// V1
requirements: [
  { type: "season", data: "Spring" },
  { type: "building", data: "Farm House" },
]

// V2 - Add consume and not flags
requirements: [
  { type: "season", data: "Spring", consume: false, not: false },
  { type: "building", data: "Farm House", consume: false, not: false },
]
```

### 4. Custom Data Storage
```typescript
// V1 - Store in class properties or closures
constructor({ area }: { area: Area }) {
  this.areaReference = area; // Or closure
}

// V2 - Store in customData
customData: {
  areaId: area.areaID,
  acres: area.acres,
  // ... any other project-specific data
}
```

### 5. Class → Template Factory
```typescript
// V1 - Constructor class
export class MyProject implements Project {
  constructor({ area }: { area: Area }) {
    // ...
  }
}

// V2 - Template factory function
export function createMyProjectTemplate(area: Area): ProjectTemplate {
  return {
    type: "My Project",
    phases: [...],
    // ...
  };
}
```

## Conversion Checklist

When converting a project to V2:

- [ ] Create handler registrations for output modifiers
- [ ] Replace `Set<number>` with `number[]` for workers
- [ ] Convert class to factory function returning `ProjectTemplate`
- [ ] Add `consume` and `not` flags to all requirements
- [ ] Store area/building references in `customData` (not direct references)
- [ ] Update output modifier format (handlers instead of functions)
- [ ] Ensure all data is JSON-serializable (no functions, Sets, Maps, etc.)
- [ ] Add `customData` field for project-specific state
- [ ] Export factory function
- [ ] Maintain backward compatibility with old constructor if needed

## Handler Naming Convention

Use descriptive, namespaced handler IDs:

```typescript
// Good
"wheat_planting_condition"
"wheat_planting_modifier"
"wheat_irrigation_condition"
"wheat_irrigation_modifier"

// Bad
"condition1"
"modifier1"
```

## Accessing Area Data in Handlers

Since we can't store direct object references, pass data through the handler:

```typescript
// In modifier handler
registerOutputModifierHandler("wheat_irrigation_modifier", (gs, data) => {
  // Data should include both project and area
  const { project, area } = data as { project: ProjectData; area: Area };

  const yieldEff = area.yieldEff.Wheat ?? 1;
  const progress = project.phases[1]?.progressPercent / 100 || 0;

  return yieldEff * progress;
});

// When calling the handler, pass both:
const modifier = getOutputModifierHandler("wheat_irrigation_modifier");
const result = modifier(gs, { project, area });
```

## Benefits of V2

1. **JSON Serializable**: Can save/load project state
2. **Hot Reloadable**: Change handlers without restart
3. **Testable**: Easy to unit test handlers
4. **Debuggable**: Inspect state as JSON
5. **Maintainable**: Clear separation of data/logic

## Template vs Instance

**Template**: The blueprint (what to create)
```typescript
const template = createFarmWheatTemplate(area);
```

**Instance**: The runtime project (actual progress)
```typescript
const project = createProjectInstance(template);
project.phases[0].progressPercent = 50; // Track progress
```

## Backward Compatibility

Keep the old constructor format for gradual migration:

```typescript
export const proj_FarmWheat = {
  constructor: ({ area }: { area?: Area }) => {
    if (!area) throw new Error("No area");
    const template = createFarmWheatTemplate(area);
    return createProjectInstance(template);
  },
  expectedOutputs: { items: ["Wheat"] },
};
```

This allows existing code to continue working while using V2 internally.

## Testing Serialization

```typescript
// Create project
const template = createFarmWheatTemplate(myArea);
const project = createProjectInstance(template);

// Make progress
project.phases[0].progressPercent = 50;

// Serialize
const json = serializeProject(project);

// Deserialize
const restored = deserializeProject(json);

// Verify
console.assert(restored.phases[0].progressPercent === 50);
console.assert(JSON.stringify(restored) === JSON.stringify(project));
```

## Complete Example: Simple Mining Project

```typescript
// handlers/miningHandlers.ts
registerOutputConditionHandler("mining_basic_condition", () => true);
registerOutputModifierHandler("mining_basic_modifier", (gs, data) => {
  const project = data as ProjectData;
  return project.phases[0]?.progressPercent / 100 || 0;
});

// projects/data/proj_MiningV2.ts
export function createMiningTemplate(): ProjectTemplate {
  return {
    type: "Mining",
    phases: [
      {
        name: "Extraction",
        manDaysRequired: 50,
        progressPercent: 0,
        requirements: [],
        stuck: false,
        outputModifiers: [
          {
            conditionHandlerId: "mining_basic_condition",
            modifierHandlerId: "mining_basic_modifier",
            description: "Progress affects output",
          },
        ],
      },
    ],
    outputs: [
      {
        type: "items",
        data: { "Iron Ore": 10 },
      },
    ],
    requirements: [
      { type: "building", data: "Mine", consume: false, not: false },
    ],
    customData: {},
  };
}
```

## Next Steps

1. Convert one project at a time
2. Test thoroughly after each conversion
3. Keep both V1 and V2 versions during migration
4. Update project processing to use V2 handlers
5. Remove V1 versions once fully migrated

This gradual approach ensures nothing breaks during migration!
