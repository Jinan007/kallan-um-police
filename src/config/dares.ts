export interface Dare {
  /** One or two words, printed on the wheel. */
  short: string;
  /** The full dare, shown after the spin. */
  text: string;
}

/** Wheel segments, in wheel order. Add or remove freely (3-14 works well). All are harmless party dares. */
export const DARES: readonly Dare[] = [
  { short: "Sing", text: "Sing the first verse of a Malayalam film song. Loudly." },
  { short: "Hero", text: "Do a slow-motion film-hero entry walk, with background music by you." },
  { short: "Chaya", text: "Make tea for everyone, or pay for the next round of snacks." },
  { short: "Squats", text: "Do 10 squats while everyone counts in Malayalam." },
  { short: "Villain", text: "Deliver a villain's dramatic laugh and monologue for 20 seconds." },
  { short: "Backwards", text: "Say the alphabet backwards without a single mistake." },
  { short: "Manglish", text: "Speak only in Manglish for the next 5 minutes." },
  { short: "Dance", text: "Dance for 30 seconds to whatever the group hums." },
  { short: "Heroine", text: "Act out an over-the-top sad film scene. Tears optional." },
  { short: "Praise", text: "Give a sincere compliment to every player, one by one." },
];

/** Segment colours, cycled. */
export const WHEEL_COLORS = ["#b3261e", "#1f3a6e", "#d4a72c", "#2f6b4f", "#7a3b6b"] as const;

