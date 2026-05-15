import type { AppState, ProjectData, QueueRuntime, QueueStatus } from "./types";

export function createRuntime(status: QueueStatus = "idle"): QueueRuntime {
  return {
    status,
    runs: [],
    history: [],
    startedEdgeIds: new Set<string>(),
    completedEdgeIds: new Set<string>(),
  };
}

export function createInitialState(): AppState {
  return {
    buildings: [],
    scenes: [],
    selectedSceneId: null,
    queues: [],
    selectedBuildingId: null,
    selectedQueueId: null,
    routeSourceId: null,
    mode: "select",
    travelDuration: 8,
    demoStep: 1,
    activeDemoStep: null,
    playing: false,
    paused: false,
    lastFrame: 0,
    routeMessage: "",
    linkDrag: null,
  };
}

export function applyProjectData(state: AppState, project: ProjectData): void {
  state.buildings = project.buildings;
  state.scenes = project.scenes;
  state.selectedSceneId = project.selectedSceneId;
  state.queues = project.queues;
  state.travelDuration = project.travelDuration;
  state.demoStep = 1;
  state.activeDemoStep = null;
  state.selectedBuildingId = state.buildings.some((item) => item.id === project.selectedBuildingId)
    ? project.selectedBuildingId
    : state.buildings[0]?.id ?? null;
  state.selectedQueueId = state.queues.some((item) => item.id === project.selectedQueueId)
    ? project.selectedQueueId
    : state.queues[0]?.id ?? null;
  state.routeSourceId = null;
  state.mode = "select";
  state.playing = false;
  state.paused = false;
  state.lastFrame = 0;
  state.routeMessage = "";
  state.linkDrag = null;
}
