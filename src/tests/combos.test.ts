import { describe, expect, it } from "vitest";
import { matchCombo, STARTER_COMBOS } from "../engine/combos";

describe("two-hand combos", () => {
  it("matches a pair regardless of left/right order", () => {
    const forward = matchCombo(["Open_Palm", "Pointing_Up"]);
    const reversed = matchCombo(["Pointing_Up", "Open_Palm"]);
    expect(forward?.id).toBe("combo-wait");
    expect(reversed?.id).toBe("combo-wait");
  });

  it("matches identical pairs", () => {
    expect(matchCombo(["Closed_Fist", "Closed_Fist"])?.text).toBe("Stop");
    expect(matchCombo(["Thumb_Up", "Thumb_Up"])?.text).toBe("Yes");
  });

  it("returns nothing for unknown pairs and wrong hand counts", () => {
    expect(matchCombo(["Thumb_Up", "Victory"])).toBeUndefined();
    expect(matchCombo(["Open_Palm"])).toBeUndefined();
    expect(matchCombo([])).toBeUndefined();
    expect(matchCombo(["Open_Palm", "Open_Palm", "Open_Palm"])).toBeUndefined();
  });

  it("keeps combo ids and phrases unique", () => {
    const ids = STARTER_COMBOS.map((combo) => combo.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
