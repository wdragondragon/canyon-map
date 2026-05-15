import { describe, expect, it } from "vitest";
import { STORAGE_KEY } from "./data/defaultMap";
import { loadProjectFromStorage, normalizeProjectData, serializeProjectData } from "./storage";

function storageWith(value: string | null) {
  return {
    getItem(key: string) {
      return key === STORAGE_KEY ? value : null;
    },
    setItem() {
      throw new Error("not used");
    },
  };
}

describe("storage", () => {
  it("converts legacy array routes to root and edges", () => {
    const project = normalizeProjectData({
      travelDuration: 12,
      queues: [{ id: "q1", name: "旧路线", route: ["s1", "s2", "s10"] }],
    });

    expect(project.queues[0].route.root).toBe("s1");
    expect(project.queues[0].route.edges.map((edge) => [edge.fromId, edge.toId])).toEqual([
      ["s1", "s2"],
      ["s2", "s10"],
    ]);
    expect(project.scenes[0].queues[0].route.edges[0]).toMatchObject({ step: 1, pauseSeconds: 0 });
  });

  it("normalizes scenes and keeps active scene queues available", () => {
    const project = normalizeProjectData({
      selectedSceneId: "scene-b",
      scenes: [
        { id: "scene-a", name: "第一场景", queues: [{ id: "q1", name: "A", route: ["s1", "s2"] }] },
        { id: "scene-b", name: "第二场景", queues: [{ id: "q2", name: "B", route: ["i1", "i2"] }] },
      ],
    });

    expect(project.selectedSceneId).toBe("scene-b");
    expect(project.queues.map((queue) => queue.id)).toEqual(["q2"]);
    expect(project.scenes.map((scene) => scene.name)).toEqual(["第一场景", "第二场景"]);
  });

  it("serializes route step and pause metadata", () => {
    const project = normalizeProjectData({
      queues: [
        {
          id: "q1",
          name: "带停顿",
          route: { root: "s1", edges: [{ id: "e1", fromId: "s1", toId: "s2", step: 2, pauseSeconds: 3 }] },
        },
      ],
    });
    const stored = serializeProjectData(project);

    expect(stored.queues[0].route.edges[0]).toMatchObject({ step: 2, pauseSeconds: 3 });
    expect(stored.scenes[0].queues[0].route.edges[0]).toMatchObject({ step: 2, pauseSeconds: 3 });
  });

  it("falls back to the sample project when localStorage is invalid", () => {
    const project = loadProjectFromStorage(storageWith("{bad-json"));

    expect(project.queues.map((queue) => queue.id)).toEqual(["q-red", "q-blue", "q-green", "q-gold"]);
    expect(project.selectedQueueId).toBe("q-red");
  });
});
