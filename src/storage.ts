import { STORAGE_KEY } from "./data/defaultMap";
import { createSampleProject } from "./data/sampleProject";
import { mergeDefaultBuildings, normalizeQueue, pruneUnreachableRoute, serializeRoute } from "./routeGraph";
import { clamp, isRecord, uid } from "./utils";
import type { AppState, ProjectData, QueueConfig, SceneConfig, StoredProjectData, StoredQueueConfig } from "./types";

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function normalizeProjectData(raw: unknown): ProjectData {
  const record = isRecord(raw) ? raw : {};
  const buildings = mergeDefaultBuildings(record.buildings);
  const legacyQueues = Array.isArray(record.queues) ? record.queues.map(normalizeQueue) : [];
  const scenes = normalizeScenes(record.scenes, legacyQueues);
  scenes.forEach((scene) => {
    scene.queues.forEach((queue) => pruneUnreachableRoute(queue, buildings));
    scene.selectedQueueId = scene.queues.some((queue) => queue.id === scene.selectedQueueId)
      ? scene.selectedQueueId
      : scene.queues[0]?.id ?? null;
  });

  const travelDuration = clamp(Number(record.travelDuration) || 8, 1, 600);
  const selectedBuildingId = buildings.some((item) => item.id === String(record.selectedBuildingId || ""))
    ? String(record.selectedBuildingId)
    : buildings[0]?.id ?? null;
  const selectedSceneId = scenes.some((scene) => scene.id === String(record.selectedSceneId || ""))
    ? String(record.selectedSceneId)
    : scenes[0]?.id ?? null;
  const activeScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];
  const queues = activeScene?.queues ?? [];
  const selectedQueueId = queues.some((item) => item.id === String(record.selectedQueueId || ""))
    ? String(record.selectedQueueId)
    : activeScene?.selectedQueueId ?? queues[0]?.id ?? null;
  if (activeScene) activeScene.selectedQueueId = selectedQueueId;

  return {
    version: 2,
    travelDuration,
    selectedBuildingId,
    selectedSceneId,
    selectedQueueId,
    buildings,
    scenes,
    queues,
  };
}

function normalizeScenes(rawScenes: unknown, legacyQueues: QueueConfig[]): SceneConfig[] {
  const scenes = Array.isArray(rawScenes)
    ? rawScenes
        .map((scene, index): SceneConfig | null => {
          if (!isRecord(scene)) return null;
          const queues = Array.isArray(scene.queues) ? scene.queues.map(normalizeQueue) : [];
          const selectedQueueId = queues.some((queue) => queue.id === String(scene.selectedQueueId || ""))
            ? String(scene.selectedQueueId)
            : queues[0]?.id ?? null;
          return {
            id: String(scene.id || uid("scene")),
            name: String(scene.name || `场景${index + 1}`),
            selectedQueueId,
            queues,
          };
        })
        .filter((scene): scene is SceneConfig => Boolean(scene))
    : [];

  if (scenes.length) return scenes;
  return [
    {
      id: "scene-default",
      name: "场景1",
      selectedQueueId: legacyQueues[0]?.id ?? null,
      queues: legacyQueues,
    },
  ];
}

export function loadProjectFromStorage(storage: StorageLike): ProjectData {
  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return normalizeProjectData(createSampleProject());

  try {
    return normalizeProjectData(JSON.parse(raw));
  } catch {
    return normalizeProjectData(createSampleProject());
  }
}

export function serializeProjectData(
  state: Pick<
    AppState,
    "travelDuration" | "selectedBuildingId" | "selectedSceneId" | "selectedQueueId" | "buildings" | "scenes" | "queues"
  >,
): StoredProjectData {
  const queues = serializeQueues(state.queues);
  const scenes = serializeScenes(state);
  return {
    version: 2,
    travelDuration: clamp(Number(state.travelDuration) || 8, 1, 600),
    selectedBuildingId: state.selectedBuildingId,
    selectedSceneId: state.selectedSceneId,
    selectedQueueId: state.selectedQueueId,
    buildings: state.buildings.map(({ id, name, x, y, fixed }) => ({ id, name, x, y, fixed })),
    scenes,
    queues,
  };
}

function serializeQueues(queues: QueueConfig[]): StoredQueueConfig[] {
  return queues.map(({ id, name, color, fontSize, markerSize, route }) => ({
    id,
    name,
    color,
    fontSize,
    markerSize,
    route: serializeRoute(route),
  }));
}

function serializeScenes(
  state: Pick<AppState, "selectedSceneId" | "selectedQueueId" | "scenes" | "queues">,
): StoredProjectData["scenes"] {
  const sourceScenes = state.scenes.length
    ? state.scenes
    : [{ id: "scene-default", name: "场景1", selectedQueueId: state.selectedQueueId, queues: state.queues }];

  return sourceScenes.map((scene) => {
    const isActive = scene.id === state.selectedSceneId;
    return {
      id: scene.id,
      name: scene.name,
      selectedQueueId: isActive ? state.selectedQueueId : scene.selectedQueueId,
      queues: serializeQueues(isActive ? state.queues : scene.queues),
    };
  });
}

export function saveProjectToStorage(
  storage: StorageLike,
  state: Pick<
    AppState,
    "travelDuration" | "selectedBuildingId" | "selectedSceneId" | "selectedQueueId" | "buildings" | "scenes" | "queues"
  >,
): void {
  storage.setItem(STORAGE_KEY, JSON.stringify(serializeProjectData(state)));
}
