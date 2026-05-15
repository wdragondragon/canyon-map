import { describe, expect, it } from "vitest";
import { createRuntime } from "./state";
import { DEFAULT_BUILDINGS } from "./data/defaultMap";
import { accelerateQueue, advanceQueue, createEligibleRuns, totalAcceleration } from "./animation";
import { normalizeQueue } from "./routeGraph";

describe("queue animation", () => {
  it("advances a queue from root to final tail", () => {
    const queue = normalizeQueue({ route: ["s1", "s2", "s10"] });
    queue.runtime = createRuntime("running");
    queue.runtime.runs = createEligibleRuns(queue, 1);

    expect(queue.runtime.runs).toHaveLength(1);

    advanceQueue(queue, 1.1, 1, DEFAULT_BUILDINGS);
    expect(queue.runtime.status).toBe("running");
    expect(queue.runtime.runs[0].fromId).toBe("s2");
    expect(queue.runtime.runs[0].toId).toBe("s10");

    advanceQueue(queue, 1, 1, DEFAULT_BUILDINGS);
    expect(queue.runtime.status).toBe("finished");
    expect(queue.runtime.history).toHaveLength(2);
  });

  it("starts branch edges after the predecessor completes", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2" },
          { id: "e2", fromId: "s2", toId: "s5" },
          { id: "e3", fromId: "s2", toId: "s10" },
        ],
      },
    });
    queue.runtime = createRuntime("running");
    queue.runtime.runs = createEligibleRuns(queue, 1);

    expect(queue.runtime.runs.map((run) => run.edgeId)).toEqual(["e1"]);

    advanceQueue(queue, 1, 1, DEFAULT_BUILDINGS);

    expect(queue.runtime.runs.map((run) => run.edgeId).sort()).toEqual(["e2", "e3"]);
  });

  it("waits for edge pause time before starting the next segment", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2", pauseSeconds: 2 },
          { id: "e2", fromId: "s2", toId: "s10" },
        ],
      },
    });
    queue.runtime = createRuntime("running");
    queue.runtime.runs = createEligibleRuns(queue, 1);

    advanceQueue(queue, 1.1, 1, DEFAULT_BUILDINGS);
    expect(queue.runtime.runs[0]).toMatchObject({ edgeId: "e1", phase: "waiting" });
    expect(queue.runtime.completedEdgeIds.has("e1")).toBe(false);

    advanceQueue(queue, 2, 1, DEFAULT_BUILDINGS);
    expect(queue.runtime.runs[0]).toMatchObject({ edgeId: "e2", phase: "moving" });
  });

  it("runs only the selected step in step mode", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2", step: 1 },
          { id: "e2", fromId: "s2", toId: "s10", step: 2 },
        ],
      },
    });
    queue.runtime = createRuntime("running");
    queue.runtime.runs = createEligibleRuns(queue, 1, 1);

    advanceQueue(queue, 1.1, 1, DEFAULT_BUILDINGS, 1);
    expect(queue.runtime.status).toBe("finished");
    expect(queue.runtime.completedEdgeIds.has("e1")).toBe(true);
    expect(queue.runtime.completedEdgeIds.has("e2")).toBe(false);

    queue.runtime = createRuntime("running");
    queue.runtime.startedEdgeIds.add("e1");
    queue.runtime.completedEdgeIds.add("e1");
    queue.runtime.runs = createEligibleRuns(queue, 1, 2);
    expect(queue.runtime.runs.map((run) => run.edgeId)).toEqual(["e2"]);
  });

  it("shortens remaining time and counts 20% and 50% acceleration", () => {
    const queue = normalizeQueue({ route: ["s1", "s2"] });
    queue.runtime = createRuntime("running");
    queue.runtime.runs = createEligibleRuns(queue, 10);
    queue.runtime.runs[0].elapsed = 2;

    accelerateQueue(queue, 0.2);
    expect(queue.runtime.runs[0].segmentDuration).toBeCloseTo(8.4);
    accelerateQueue(queue, 0.5);
    expect(queue.runtime.runs[0].segmentDuration).toBeCloseTo(5.2);

    expect(totalAcceleration(queue)).toEqual({ twenty: 1, fifty: 1 });
  });

  it("finishes an empty-route queue immediately", () => {
    const queue = normalizeQueue({ route: [] });
    queue.runtime = createRuntime(queue.route.edges.length ? "running" : "finished");
    queue.runtime.runs = createEligibleRuns(queue, 1);

    expect(queue.runtime.status).toBe("finished");
    expect(queue.runtime.runs).toHaveLength(0);
  });
});
