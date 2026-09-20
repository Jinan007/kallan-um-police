import { describe, expect, it } from "vitest";
import { memeUrl, pickMeme } from "./memes";

describe("pickMeme", () => {
  it("returns null for an empty or missing folder", () => {
    expect(pickMeme([])).toBeNull();
    expect(pickMeme(undefined)).toBeNull();
  });
  it("picks by the random number, never out of range", () => {
    const files = ["a.jpg", "b.jpg", "c.jpg"];
    expect(pickMeme(files, () => 0)).toBe("a.jpg");
    expect(pickMeme(files, () => 0.5)).toBe("b.jpg");
    expect(pickMeme(files, () => 0.999999)).toBe("c.jpg");
    expect(pickMeme(files, () => 1)).toBe("c.jpg");
  });
});

describe("memeUrl", () => {
  it("builds a path and escapes odd file names", () => {
    expect(memeUrl("caught", "caught.jpg")).toBe("/memes/caught/caught.jpg");
    expect(memeUrl("caught", "my pic.jpg")).toBe("/memes/caught/my%20pic.jpg");
  });
});
