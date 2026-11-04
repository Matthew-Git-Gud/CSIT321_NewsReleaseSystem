// These are curated rather than fully arbitrary colours so button labels,
// focus states, and body text remain readable for every theme.
export const ACCENT_COLOURS = [
  {
    id: "emerald",
    label: "Evergreen",
    description: "The original News Release look",
    swatch: "#126d66",
  },
  {
    id: "ocean",
    label: "Ocean blue",
    description: "Clear and calm",
    swatch: "#176b87",
  },
  {
    id: "violet",
    label: "Violet ink",
    description: "Editorial and creative",
    swatch: "#6754a6",
  },
  {
    id: "coral",
    label: "Coral",
    description: "Warm and energetic",
    swatch: "#b4514c",
  },
  {
    id: "amber",
    label: "Amber",
    description: "Warm and welcoming",
    swatch: "#9a6718",
  },
  {
    id: "indigo",
    label: "Indigo",
    description: "Bold and balanced",
    swatch: "#4f5fb6",
  },
  {
    id: "rose",
    label: "Rose",
    description: "Soft and expressive",
    swatch: "#b84c70",
  },
  {
    id: "terracotta",
    label: "Terracotta",
    description: "Earthy and warm",
    swatch: "#aa5e3a",
  },
  {
    id: "sky",
    label: "Sky blue",
    description: "Bright and open",
    swatch: "#287ea1",
  },
  {
    id: "plum",
    label: "Plum",
    description: "Rich and refined",
    swatch: "#7b4f88",
  },
] as const;

export type AccentColour =
  (typeof ACCENT_COLOURS)[number]["id"];

export const DEFAULT_ACCENT_COLOUR: AccentColour =
  "emerald";

export const isAccentColour = (
  value: unknown,
): value is AccentColour =>
  ACCENT_COLOURS.some(
    (colour) => colour.id === value,
  );
