import { describe, expect, it } from "vitest";
import { pendingTasks } from "./task-visibility";
describe("completed tasks", () => {
  it("hides completed tasks immediately and preserves remaining tasks", () => {
    expect(pendingTasks([{ id: "story" }, { id: "share" }, { id: "partner" }], ["story", "share"])).toEqual([{ id: "partner" }]);
  });
  it("keeps completed tasks hidden after refresh", () => {
    expect(pendingTasks([{ id: "story" }], ["story"])).toEqual([]);
  });
});