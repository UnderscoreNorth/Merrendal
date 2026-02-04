# Encyclopedia System Guide

## Overview

The encyclopedia system provides an easy-to-maintain, browsable knowledge base with hotlinked pages. Each page is defined as a TypeScript data structure, making it simple to write and edit content while maintaining type safety.

## System Components

1. **Page Data Files** (`/data/encyclopedia/` directory) - TypeScript files defining page content
2. **WikiLink Component** - Reusable hotlink component for navigation
3. **Encyclopedia.svelte** - Main encyclopedia viewer that renders the data

## Opening the Encyclopedia

To open the encyclopedia from anywhere in your code:

```typescript
import { openModals } from "$lib/stores";

// Open encyclopedia to a specific page
function openEncyclopedia(pageId: string = "index") {
  const windowId = `encyclopedia-${Date.now()}-${Math.random()}`;
  if (!$openModals.Encyclopedia) {
    $openModals.Encyclopedia = {};
  }
  $openModals.Encyclopedia[windowId] = { id: 0, page: pageId };
  $openModals = $openModals;
}

// Example: Open to the buildings page
openEncyclopedia("buildings");
```

## Creating a New Page

### Step 1: Create the Page Data File

Create a new `.ts` file in `/src/lib/data/encyclopedia/`:

**Example: `weapons.ts`**

```typescript
import type { EncyclopediaPage } from "./types";

export const weaponsPage: EncyclopediaPage = {
  id: "weapons",
  title: "Weapons & Combat",
  content: [
    {
      type: "text",
      content:
        "Weapons are crafted in buildings by workers. They require various resources to produce.",
    },
    {
      type: "heading",
      level: 3,
      content: "Weapon Types",
    },
    {
      type: "list",
      items: [
        { type: "text", content: "Spears - Basic melee weapon" },
        { type: "text", content: "Swords - Advanced melee weapon" },
        { type: "text", content: "Arrows - Ranged ammunition" },
      ],
    },
    {
      type: "heading",
      level: 3,
      content: "Production",
    },
    {
      type: "text",
      content:
        "Assign workers to a Forge to begin crafting weapons. See the industry page for more details.",
    },
  ],
};
```

### Step 2: Register the Page

Edit `pages.ts`:

1. **Import the page:**
```typescript
import { weaponsPage } from "./weapons";
```

2. **Add to encyclopediaPages:**
```typescript
export const encyclopediaPages: Record<string, EncyclopediaPage> = {
  // ... existing pages ...
  weapons: weaponsPage,
};
```

That's it! Your page is now available.

## Content Types

The encyclopedia supports several content types:

### Text Content

```typescript
{
  type: "text",
  content: "Your paragraph text here.",
}
```

### Headings

```typescript
// Level 2 heading (h2)
{
  type: "heading",
  level: 2,
  content: "Major Section Title",
}

// Level 3 heading (h3)
{
  type: "heading",
  level: 3,
  content: "Subsection Title",
}
```

### Lists

```typescript
{
  type: "list",
  items: [
    { type: "text", content: "First item" },
    { type: "text", content: "Second item" },
    {
      type: "link",
      to: "buildings",
      content: "Link to buildings page",
    },
  ],
}
```

### Links

Links can be used in lists:

```typescript
{
  type: "link",
  to: "page-id",
  content: "Display text for the link",
}
```

Note: For inline links within paragraph text, you'll need to split the text into multiple content items.

## Page Structure

A complete page example:

```typescript
import type { EncyclopediaPage } from "./types";

export const myPage: EncyclopediaPage = {
  id: "my-topic",
  title: "My Topic Title",
  content: [
    {
      type: "text",
      content: "Introduction paragraph.",
    },
    {
      type: "heading",
      level: 3,
      content: "First Section",
    },
    {
      type: "text",
      content: "Section content here.",
    },
    {
      type: "list",
      items: [
        { type: "text", content: "Plain list item" },
        {
          type: "link",
          to: "buildings",
          content: "Link to buildings",
        },
      ],
    },
  ],
};
```

## File Organization

```
src/lib/data/encyclopedia/
├── types.ts                 # TypeScript type definitions
├── pages.ts                 # Page registry
├── index.ts                 # Home page
├── village.ts               # Village management
├── buildings.ts             # Buildings overview
├── population.ts            # Population management
├── resources.ts             # Resources overview
├── farming.ts               # Farming guide
├── industry.ts              # Industry guide
├── trade.ts                 # Trade guide
└── [your-page].ts          # Add new pages here
```

## Best Practices

1. **One topic per file** - Keep pages focused on a single subject
2. **Use kebab-case** - Name files with hyphens (e.g., `my-topic.ts`)
3. **Type safety** - Use the `EncyclopediaPage` type for all pages
4. **Consistent structure** - Start with text intro, then sections with headings
5. **Update the index** - Add new major topics to `index.ts`
6. **Register in pages.ts** - Don't forget to import and register new pages

## Adding to the Index

When you create a major topic page, add it to `index.ts`:

```typescript
{
  type: "list",
  items: [
    // ... existing items ...
    {
      type: "link",
      to: "my-topic",
      content: "My Topic - Brief description",
    },
  ],
}
```

This makes it discoverable from the encyclopedia home page.

## Type Reference

### EncyclopediaContent

```typescript
export type EncyclopediaContent = {
  type: "text" | "heading" | "list" | "link";
  content?: string;
  level?: 2 | 3; // for headings
  items?: EncyclopediaContent[]; // for lists
  to?: string; // for links
};
```

### EncyclopediaPage

```typescript
export type EncyclopediaPage = {
  id: string;
  title: string;
  content: EncyclopediaContent[];
};
```

## Special Pages

Three pages are dynamically generated from game data and hardcoded in Encyclopedia.svelte:

- **building-list** - Lists all buildings with stats
- **item-list** - Lists all items by category
- **animal-list** - Lists all animals with properties

These pages automatically stay up-to-date with your game data files.

## Features

### Navigation
- **Home button** - Returns to index page
- **Back button** - Navigate through history
- **Close button (×)** - Closes the encyclopedia window

### Multiple Windows
You can open multiple encyclopedia windows simultaneously, each with independent navigation history.

### Type Safety
All pages are type-checked at compile time, preventing errors and ensuring consistency.

## Advantages of TypeScript Format

✅ **Type safety** - Catch errors at compile time
✅ **Autocomplete** - IDEs provide suggestions
✅ **Easy to maintain** - Clear data structure
✅ **Version control friendly** - Easy to diff and merge
✅ **No parsing** - Direct JavaScript objects
✅ **Integrated** - Same language as rest of codebase
