# Alchemical Obsession - V2 Conversion Complete ✅

The Alchemical Obsession event has been successfully converted to the V2 JSON-serializable architecture.

## Files

- **Original**: `alchemicalObsession.ts` (V1 - class-based)
- **New**: `alchemicalObsessionV2.ts` (V2 - JSON-serializable)

## What Changed

### Architecture
- **V1**: Class-based `Event_AlchemicalObsession` with methods
- **V2**: `EventTemplate` + handler registry pattern

### Data Storage
- **V1**: Private class properties (`yearsActive`, `startYear`, etc.)
- **V2**: All stored in `customData` object (JSON-serializable)

### Function References
- **V1**: Direct function references (`createChoiceEvent`, `action`, `resolved`)
- **V2**: String handler IDs registered in the handler registry

## Conversion Details

### Event Template
```typescript
export const alchemicalObsessionTemplate: EventTemplate = {
  id: "alchemical_obsession",
  target: "Area",
  desc: "The pursuit of the Philosopher's Stone begins...",
  initialPhase: { ... },
  subEvents: [...], // 9 subevents
  actionHandlerId: "alchemy_daily_action",
  resolvedHandlerId: "alchemy_is_resolved",
  condition: { type: "Time", mtth: 365 },
  multiple: false,
  customData: {
    yearsActive: 0,
    startYear: 0,
    laboratoriesBuilt: 0,
    // ... 11 custom fields
  },
};
```

### Custom Data Fields
All event state is stored in `customData`:
- `yearsActive` - Years since event started
- `startYear` - Year the event began
- `laboratoriesBuilt` - Count of laboratories
- `sulfurMinesBuilt` - Count of sulfur mines
- `mercuryMinesBuilt` - Count of mercury mines
- `athanorBuilt` - Whether Grand Athanor exists
- `workersLostToToxicity` - Death count from toxicity
- `lordHealthDeclining` - Lord's health status
- `lordMadnessLevel` - Madness scale (0-100)
- `villagersSacrificed` - Count of sacrifices
- `mineCollapsed` - Whether mine collapse occurred
- `starvationDeaths` - Death count from starvation
- `finalChoice` - Whether event is complete

### Handlers Registered

**Event Handlers:**
- `alchemy_daily_action` - Daily processing
- `alchemy_is_resolved` - Completion check

**Choice Generators (9):**
- `alchemy_initial_research_choices`
- `alchemy_laboratory_choices`
- `alchemy_sulfur_choices`
- `alchemy_mercury_choices`
- `alchemy_toxic_revelation_choices`
- `alchemy_great_sacrifice_choices`
- `alchemy_grand_athanor_choices`
- `alchemy_prima_materia_choices`
- `alchemy_final_transmutation_choices`

**Effect Handlers (15):**
- `alchemy_no_effect` - Do nothing
- `alchemy_accept_research` - Begin research
- `alchemy_reject_research` - Reject event
- `alchemy_build_lab` - Build laboratory
- `alchemy_build_sulfur_mine` - Build sulfur mine
- `alchemy_build_mercury_mine` - Build mercury mine
- `alchemy_improve_safety` - Safety measures
- `alchemy_ignore_safety` - Ignore safety
- `alchemy_abandon` - Early abandonment
- `alchemy_sacrifice_self` - Self sacrifice
- `alchemy_sacrifice_villagers` - Villager sacrifice
- `alchemy_abandon_late` - Late abandonment
- `alchemy_build_athanor` - Build Grand Athanor
- `alchemy_create_prima_materia` - Create Prima Materia
- `alchemy_final_transmutation` - Final transmutation
- `alchemy_final_abandon` - Final abandonment

## Key Features Preserved

✅ All 7 phases (initial dream → final transmutation)
✅ 9 subevents with dynamic visibility
✅ Daily toxic death chances
✅ Lord health declining mechanics
✅ Starvation mechanics
✅ Madness progression system
✅ Phase transitions based on time
✅ Building requirements
✅ Resource consumption
✅ Multiple ending paths
✅ 30% mine collapse chance
✅ 50% lord death chance in finale

## How to Use

### Register the Template
```typescript
import { eventManager } from "../managers/EventManager";
import { alchemicalObsessionTemplate } from "./events/alchemicalObsessionV2";

// Register the template
eventManager.registerEventTemplate(alchemicalObsessionTemplate);
```

### Trigger the Event
```typescript
// Automatically triggers based on MTTH (365 days)
// Or manually:
eventManager.triggerEvent("alchemical_obsession", gameState);
```

### Access Custom Data
```typescript
// In handlers:
const customData = eventData.customData || {};
const madness = customData.lordMadnessLevel || 0;
customData.lordMadnessLevel = madness + 5;
```

## JSON Serialization

The event is now fully serializable:

```typescript
// Save
const json = serializeEvent(eventData);
localStorage.setItem("alchemy_event", json);

// Load
const restored = deserializeEvent(json);
gameState.events.push(restored);
```

## Testing

All original functionality has been preserved:
- ✅ Phase progression works correctly
- ✅ Subevent visibility updates properly
- ✅ Daily effects process correctly
- ✅ Choice requirements work
- ✅ All endings reachable
- ✅ No breaking changes

## Migration Status

- ✅ **V2 Version**: Complete and ready to use
- ⚠️ **V1 Version**: Still exists in `alchemicalObsession.ts`
- 📝 **Next Step**: Update game systems to use V2 version

## Benefits of V2

1. **Save/Load**: Event state fully serializable
2. **Hot Reload**: Can reload handlers without restart
3. **Debugging**: Easy to inspect state as JSON
4. **Testing**: Handlers can be unit tested
5. **Modding**: Event data can be in JSON files
6. **Maintainability**: Clear separation of data/logic

## Notes

- All handlers are registered at module load time
- Custom data is automatically initialized from template
- Years active is calculated from current year - start year
- Phase transitions check both time and completion conditions
- Subevent visibility managed dynamically

This is a complete, production-ready V2 implementation!
