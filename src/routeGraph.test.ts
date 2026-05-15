import { describe, expect, it } from "vitest";
import { DEFAULT_BUILDINGS, DEFAULT_LINKS } from "./data/defaultMap";
import { createSampleProject } from "./data/sampleProject";
import {
  canAppendRouteTarget,
  isLinkedBuildings,
  normalizeQueue,
  normalizeRoute,
  pruneUnreachableRoute,
} from "./routeGraph";

describe("route graph", () => {
  it("rejects non-adjacent route targets", () => {
    const queue = normalizeQueue({ route: ["s1"] });

    expect(canAppendRouteTarget(queue, "f1", "s1", { playing: false })).toBe(false);
  });

  it("rejects self connections", () => {
    const queue = normalizeQueue({ route: ["s1"] });

    expect(canAppendRouteTarget(queue, "s1", "s1", { playing: false })).toBe(false);
  });

  it("allows more than two outgoing edges from one node when targets are adjacent", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2" },
          { id: "e2", fromId: "s1", toId: "s3" },
        ],
      },
    });

    expect(canAppendRouteTarget(queue, "s4", "s1", { playing: false })).toBe(true);
  });

  it("allows repeated traversal of the same adjacent edge", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2" },
          { id: "e2", fromId: "s2", toId: "s1" },
        ],
      },
    });

    expect(canAppendRouteTarget(queue, "s2", "s1", { playing: false })).toBe(true);
  });

  it("preserves repeated route edges during normalization", () => {
    const route = normalizeRoute({
      root: "s1",
      edges: [
        { id: "e1", fromId: "s1", toId: "s2" },
        { id: "e2", fromId: "s2", toId: "s1" },
        { id: "e3", fromId: "s1", toId: "s2" },
      ],
    });

    expect(route.edges.map((edge) => [edge.fromId, edge.toId])).toEqual([
      ["s1", "s2"],
      ["s2", "s1"],
      ["s1", "s2"],
    ]);
  });

  it("prunes unreachable route edges", () => {
    const queue = normalizeQueue({
      route: {
        root: "s1",
        edges: [
          { id: "e1", fromId: "s1", toId: "s2" },
          { id: "e2", fromId: "s3", toId: "s6" },
        ],
      },
    });

    pruneUnreachableRoute(queue, DEFAULT_BUILDINGS);

    expect(queue.route.edges).toEqual([{ id: "e1", fromId: "s1", toId: "s2", step: 1, pauseSeconds: 0 }]);
  });

  it("normalizes route edge step and pause metadata", () => {
    const route = normalizeRoute({
      root: "s1",
      edges: [{ id: "e1", fromId: "s1", toId: "s2", step: 3, pauseSeconds: 2.5 }],
    });

    expect(route.edges[0]).toMatchObject({ step: 3, pauseSeconds: 2.5 });
  });

  it("keeps the default link table internally valid", () => {
    const ids = new Set(DEFAULT_BUILDINGS.map((item) => item.id));

    expect(DEFAULT_LINKS.every(([fromId, toId]) => ids.has(fromId) && ids.has(toId) && isLinkedBuildings(fromId, toId))).toBe(true);
  });

  it("includes I21 to I24 as adjacent buildings", () => {
    expect(isLinkedBuildings("i21", "i24")).toBe(true);
    expect(isLinkedBuildings("i24", "i21")).toBe(true);
  });

  it("does not connect I21 to I22", () => {
    expect(isLinkedBuildings("i21", "i22")).toBe(false);
    expect(isLinkedBuildings("i22", "i21")).toBe(false);
  });

  it("normalizes all sample routes into valid adjacent edges", () => {
    const sample = createSampleProject();
    const queues = Array.isArray(sample.queues) ? sample.queues : [];

    queues.forEach((queue) => {
      const route = normalizeRoute(queue.route);
      expect(route.root).toBeTruthy();
      expect(route.edges.every((edge) => isLinkedBuildings(edge.fromId, edge.toId))).toBe(true);
    });
  });
});
