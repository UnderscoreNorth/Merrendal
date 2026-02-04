export type EncyclopediaContent = {
  type: "text" | "heading" | "list" | "link";
  content?: string;
  level?: 2 | 3; // for headings
  items?: EncyclopediaContent[]; // for lists
  to?: string; // for links
};

export type EncyclopediaPage = {
  id: string;
  title: string;
  content: EncyclopediaContent[];
};
