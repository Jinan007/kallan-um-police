/**
 * Single-pen-stroke skeletons for the characters used on the scoreboard, each drawn inside a
 * 10 wide x 16 tall box (y grows downward). The scoreboard draws these one by one with a pen.
 * Strokes that need a lift of the pen (like the cross of "+") are separate "M" segments in one path.
 */
export const GLYPHS: Record<string, string> = {
  "0": "M5 1C1 1 1 15 5 15C9 15 9 1 5 1",
  "1": "M3 4L6 1L6 15",
  "2": "M1.5 4C2 0.5 8.5 0.5 8.5 4.5C8.5 8 2 11 1.5 15L9 15",
  "3": "M1.5 2C6 0 9 3 5.5 7.5C10 8 9.5 15 1.5 14",
  "4": "M7.5 15L7.5 1L1 10.5L9.5 10.5",
  "5": "M8.5 1L2.5 1L2 7C7 5.5 10 9.5 7.5 13.5C5.5 15.5 2.5 15 1.5 13",
  "6": "M8 2C4 0 1 5 1.5 10.5C2 16 9 16 9 11C9 7 3 6.5 1.5 10.5",
  "7": "M1 1L9 1L4.5 15",
  "8": "M5 8C1 6.5 2 1 5 1C8 1 9 6 5 8C1 10 0.5 15 5 15C9.5 15 9 10 5 8",
  "9": "M8.5 5.5C7 0.5 1 1.5 1.5 5.5C2 9 8 9.5 8.5 5.5C8.5 10 7 14 3.5 15",
  "+": "M5 4L5 12M1 8L9 8",
  "-": "M1 8L9 8",
};
