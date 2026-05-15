import "../styles.css";

import { createSampleProject } from "./data/sampleProject";
import { createEligibleRuns, accelerateQueue, advanceQueue } from "./animation";
import { createInitialState, createRuntime, applyProjectData } from "./state";
import {
  addRouteEdge,
  canAppendRouteTarget,
  canStartRouteLink,
  getActiveRouteSourceId,
  getMaxRouteStep,
  normalizeQueue,
  pruneUnreachableRoute,
  serializeRoute,
} from "./routeGraph";
import { loadProjectFromStorage, normalizeProjectData, saveProjectToStorage } from "./storage";
import {
  findBuildingIdAtPoint,
  render,
  renderAccelerationPanel,
  renderBuildingEditor,
  renderBuildingList,
  renderBuildings,
  renderMode,
  renderQueueEditor,
  renderQueueList,
  renderQueues,
  renderRouteSelect,
  renderRouteSourceSelect,
  renderRoutes,
  renderStatus,
  updateMapStageSize,
} from "./render";
import type { RenderContext } from "./render";
import type { ElementRefs, QueueConfig, RouteEdge } from "./types";
import { clamp, uid } from "./utils";

const state = createInitialState();
let el: ElementRefs;
let context: RenderContext;
let animationFrameId = 0;
let dragState: {
  type: "route-link";
  sourceId: string;
  pointerId: number;
  startClientX: number;
  startClientY: number;
  moved: boolean;
} | null = null;

document.addEventListener("DOMContentLoaded", () => {
  el = bindElements();
  context = {
    state,
    el,
    actions: {
      selectBuilding,
      selectQueue,
      startBuildingPointer,
      moveRouteStep,
      removeRouteStep,
      updateRouteEdge,
    },
  };
  bindEvents();

  applyProjectData(state, loadProjectFromStorage(window.localStorage));
  renderApp();
  window.requestAnimationFrame(() => updateMapStageSize(context));
});

function bindElements(): ElementRefs {
  return {
    selectModeBtn: getRequiredElement("selectModeBtn"),
    addBuildingModeBtn: getRequiredElement("addBuildingModeBtn"),
    durationInput: getRequiredElement("durationInput"),
    demoStepInput: getRequiredElement("demoStepInput"),
    startBtn: getRequiredElement("startBtn"),
    startStepBtn: getRequiredElement("startStepBtn"),
    nextStepBtn: getRequiredElement("nextStepBtn"),
    pauseBtn: getRequiredElement("pauseBtn"),
    resetBtn: getRequiredElement("resetBtn"),
    mapStage: getRequiredElement("mapStage"),
    routeLayer: getRequiredElement("routeLayer"),
    queueLayer: getRequiredElement("queueLayer"),
    buildingLayer: getRequiredElement("buildingLayer"),
    selectionStatus: getRequiredElement("selectionStatus"),
    progressStatus: getRequiredElement("progressStatus"),
    countStatus: getRequiredElement("countStatus"),
    sceneSelect: getRequiredElement("sceneSelect"),
    createSceneBtn: getRequiredElement("createSceneBtn"),
    deleteSceneBtn: getRequiredElement("deleteSceneBtn"),
    loadSampleBtn: getRequiredElement("loadSampleBtn"),
    clearProjectBtn: getRequiredElement("clearProjectBtn"),
    buildingEditor: getRequiredElement("buildingEditor"),
    buildingNameInput: getRequiredElement("buildingNameInput"),
    addQueueAtBuildingBtn: getRequiredElement("addQueueAtBuildingBtn"),
    deleteBuildingBtn: getRequiredElement("deleteBuildingBtn"),
    buildingList: getRequiredElement("buildingList"),
    createQueueBtn: getRequiredElement("createQueueBtn"),
    queueList: getRequiredElement("queueList"),
    queueEditor: getRequiredElement("queueEditor"),
    queueNameInput: getRequiredElement("queueNameInput"),
    queueColorInput: getRequiredElement("queueColorInput"),
    queueFontSizeInput: getRequiredElement("queueFontSizeInput"),
    queueMarkerSizeInput: getRequiredElement("queueMarkerSizeInput"),
    routeSourceSelect: getRequiredElement("routeSourceSelect"),
    routeBuildingSelect: getRequiredElement("routeBuildingSelect"),
    routeStepInput: getRequiredElement("routeStepInput"),
    routePauseInput: getRequiredElement("routePauseInput"),
    appendRouteStepBtn: getRequiredElement("appendRouteStepBtn"),
    routeStepsList: getRequiredElement("routeStepsList"),
    clearRouteBtn: getRequiredElement("clearRouteBtn"),
    deleteQueueBtn: getRequiredElement("deleteQueueBtn"),
    accel20Btn: getRequiredElement("accel20Btn"),
    accel50Btn: getRequiredElement("accel50Btn"),
    accelStats: getRequiredElement("accelStats"),
    segmentLog: getRequiredElement("segmentLog"),
    mapPane: document.querySelector(".map-pane") as HTMLElement,
    statusStrip: document.querySelector(".status-strip") as HTMLElement,
  };
}

function getRequiredElement<T extends Element>(id: string): T {
  const element = document.getElementById(id);
  if (!element) {
    throw new Error(`Missing required element: ${id}`);
  }
  return element as unknown as T;
}

function bindEvents(): void {
  window.addEventListener("resize", () => updateMapStageSize(context));
  el.selectModeBtn.addEventListener("click", () => setMode("select"));
  el.addBuildingModeBtn.addEventListener("click", () => setMode("select"));
  el.durationInput.addEventListener("change", () => {
    state.travelDuration = clamp(Number(el.durationInput.value) || 8, 1, 600);
    el.durationInput.value = String(state.travelDuration);
    saveProject();
    renderStatus(context);
  });
  el.demoStepInput.addEventListener("change", () => {
    state.demoStep = normalizeStep(el.demoStepInput.value);
    el.demoStepInput.value = String(state.demoStep);
    el.routeStepInput.value = String(state.demoStep);
    renderStatus(context);
  });
  el.routeStepInput.addEventListener("change", () => {
    state.demoStep = normalizeStep(el.routeStepInput.value);
    el.routeStepInput.value = String(state.demoStep);
    el.demoStepInput.value = String(state.demoStep);
    renderStatus(context);
  });

  el.startBtn.addEventListener("click", () => startDemo(null));
  el.startStepBtn.addEventListener("click", () => startDemo(state.demoStep));
  el.nextStepBtn.addEventListener("click", startNextStep);
  el.pauseBtn.addEventListener("click", togglePause);
  el.resetBtn.addEventListener("click", resetDemo);

  el.sceneSelect.addEventListener("change", () => switchScene(el.sceneSelect.value));
  el.createSceneBtn.addEventListener("click", createScene);
  el.deleteSceneBtn.addEventListener("click", deleteCurrentScene);

  el.mapStage.addEventListener("click", () => {
    state.routeMessage = "";
    renderStatus(context);
  });

  el.loadSampleBtn.addEventListener("click", () => {
    if (state.playing) return;
    applyProjectData(state, normalizeProjectData(createSampleProject()));
    saveProject();
    renderApp();
  });

  el.clearProjectBtn.addEventListener("click", () => {
    if (state.playing) return;
    if (!window.confirm("清空当前场景的队列配置？固定建筑点和其他场景会保留。")) return;
    state.queues = [];
    state.selectedQueueId = null;
    state.routeSourceId = null;
    saveProject();
    renderApp();
  });

  el.buildingNameInput.addEventListener("input", () => {
    const building = getSelectedBuilding();
    if (!building) return;
    building.name = el.buildingNameInput.value.trim() || "未命名建筑";
    saveProject();
    renderBuildingListsOnly();
  });

  el.deleteBuildingBtn.addEventListener("click", deleteSelectedBuilding);
  el.addQueueAtBuildingBtn.addEventListener("click", () => {
    const building = getSelectedBuilding();
    if (!building || state.playing) return;
    createQueue([building.id]);
  });
  el.createQueueBtn.addEventListener("click", () => createQueue(defaultQueueRoute()));

  el.queueNameInput.addEventListener("input", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.name = el.queueNameInput.value.trim() || "未命名队列";
    saveProject();
    renderQueueListsOnly();
  });

  el.queueColorInput.addEventListener("input", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.color = el.queueColorInput.value;
    saveProject();
    renderQueueListsOnly();
    renderRoutesOnly();
    renderQueuesOnly();
  });

  el.queueFontSizeInput.addEventListener("change", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.fontSize = clamp(Number(el.queueFontSizeInput.value) || 14, 10, 32);
    saveProject();
    renderQueuesOnly();
    renderQueueEditor(context);
  });

  el.queueMarkerSizeInput.addEventListener("change", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.markerSize = clamp(Number(el.queueMarkerSizeInput.value) || 18, 10, 36);
    saveProject();
    renderQueuesOnly();
    renderQueueEditor(context);
  });

  el.routeSourceSelect.addEventListener("change", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    const value = el.routeSourceSelect.value;
    if (value && state.buildings.some((item) => item.id === value)) {
      state.routeSourceId = value;
      state.selectedBuildingId = value;
    }
    saveProject();
    renderApp();
  });

  el.appendRouteStepBtn.addEventListener("click", appendRouteStep);
  el.clearRouteBtn.addEventListener("click", clearSelectedRoute);
  el.deleteQueueBtn.addEventListener("click", deleteSelectedQueue);
  el.accel20Btn.addEventListener("click", () => accelerateSelectedQueue(0.2));
  el.accel50Btn.addEventListener("click", () => accelerateSelectedQueue(0.5));
}

function renderApp(): void {
  render(context);
}

function renderQueueListsOnly(): void {
  renderQueueList(context);
  renderQueueEditor(context);
  renderRouteSourceSelect(context);
  renderRouteSelect(context);
  renderStatus(context);
}

function renderBuildingListsOnly(): void {
  renderBuildings(context);
  renderRoutes(context);
  renderBuildingList(context);
  renderBuildingEditor(context);
  renderQueueListsOnly();
}

function renderQueuesOnly(): void {
  renderQueues(context);
}

function renderRoutesOnly(): void {
  renderRoutes(context);
}

function saveProject(): void {
  syncActiveScene();
  saveProjectToStorage(window.localStorage, state);
}

function syncActiveScene(): void {
  const scene = state.scenes.find((item) => item.id === state.selectedSceneId);
  if (!scene) return;
  scene.queues = state.queues.map(cloneQueueConfig);
  scene.selectedQueueId = state.selectedQueueId;
}

function cloneQueueConfig(queueItem: QueueConfig): QueueConfig {
  return normalizeQueue({
    id: queueItem.id,
    name: queueItem.name,
    color: queueItem.color,
    fontSize: queueItem.fontSize,
    markerSize: queueItem.markerSize,
    route: serializeRoute(queueItem.route),
  });
}

function switchScene(sceneId: string): void {
  if (state.playing || sceneId === state.selectedSceneId) return;
  syncActiveScene();
  const scene = state.scenes.find((item) => item.id === sceneId);
  if (!scene) return;
  state.selectedSceneId = scene.id;
  state.queues = scene.queues.map(cloneQueueConfig);
  state.selectedQueueId = state.queues.some((item) => item.id === scene.selectedQueueId)
    ? scene.selectedQueueId
    : state.queues[0]?.id ?? null;
  state.routeSourceId = null;
  state.routeMessage = "";
  state.demoStep = 1;
  saveProject();
  renderApp();
}

function createScene(): void {
  if (state.playing) return;
  syncActiveScene();
  const scene = {
    id: uid("scene"),
    name: `场景${state.scenes.length + 1}`,
    selectedQueueId: null,
    queues: [],
  };
  state.scenes.push(scene);
  state.selectedSceneId = scene.id;
  state.queues = [];
  state.selectedQueueId = null;
  state.routeSourceId = null;
  state.routeMessage = "";
  state.demoStep = 1;
  saveProject();
  renderApp();
}

function deleteCurrentScene(): void {
  if (state.playing || state.scenes.length <= 1) return;
  const scene = state.scenes.find((item) => item.id === state.selectedSceneId);
  if (!scene) return;
  if (!window.confirm(`删除${scene.name}？其中的队列配置会被删除。`)) return;
  state.scenes = state.scenes.filter((item) => item.id !== scene.id);
  const nextScene = state.scenes[0];
  state.selectedSceneId = nextScene.id;
  state.queues = nextScene.queues.map(cloneQueueConfig);
  state.selectedQueueId = state.queues.some((item) => item.id === nextScene.selectedQueueId)
    ? nextScene.selectedQueueId
    : state.queues[0]?.id ?? null;
  state.routeSourceId = null;
  state.routeMessage = "";
  state.demoStep = 1;
  saveProject();
  renderApp();
}

function selectBuilding(id: string): void {
  state.selectedBuildingId = id;
  saveProject();
  renderApp();
}

function selectQueue(id: string): void {
  state.selectedQueueId = id;
  state.routeSourceId = null;
  saveProject();
  renderApp();
}

function startBuildingPointer(event: PointerEvent, buildingId: string): void {
  event.preventDefault();
  event.stopPropagation();
  state.selectedBuildingId = buildingId;
  state.routeSourceId = buildingId;
  state.routeMessage = "";

  const queueItem = getSelectedQueue();
  if (!canStartRouteLink(queueItem, buildingId, state)) {
    saveProject();
    renderApp();
    return;
  }

  dragState = {
    type: "route-link",
    sourceId: buildingId,
    pointerId: event.pointerId,
    startClientX: event.clientX,
    startClientY: event.clientY,
    moved: false,
  };
  const selected = getSelectedBuilding();
  const point = selected ? getMapPointForBuilding(selected) : { x: 0, y: 0 };
  state.linkDrag = {
    sourceId: buildingId,
    x: point.x,
    y: point.y,
    targetId: null,
  };

  window.addEventListener("pointermove", handleRouteLinkDrag);
  window.addEventListener("pointerup", finishRouteLinkDrag, { once: true });
  renderApp();
}

function handleRouteLinkDrag(event: PointerEvent): void {
  if (!dragState || event.pointerId !== dragState.pointerId) return;

  const dx = event.clientX - dragState.startClientX;
  const dy = event.clientY - dragState.startClientY;
  if (Math.hypot(dx, dy) > 3) dragState.moved = true;

  const point = eventToMapPoint(event);
  if (!point) return;

  const targetId = findBuildingIdAtPoint(el, event.clientX, event.clientY);
  state.linkDrag = {
    sourceId: dragState.sourceId,
    x: point.x,
    y: point.y,
    targetId: targetId && canAppendRouteTarget(getSelectedQueue(), targetId, dragState.sourceId, state) ? targetId : null,
  };
  renderRoutesOnly();
  renderBuildingsOnly();
  renderStatus(context);
}

function finishRouteLinkDrag(event: PointerEvent): void {
  window.removeEventListener("pointermove", handleRouteLinkDrag);
  if (dragState) {
    const queueItem = getSelectedQueue();
    const targetId = findBuildingIdAtPoint(el, event.clientX, event.clientY);
    if (dragState.moved && queueItem && targetId && canAppendRouteTarget(queueItem, targetId, dragState.sourceId, state)) {
      addRouteEdge(queueItem, dragState.sourceId, targetId, state.buildings, getRouteEdgeDraft());
      queueItem.runtime = createRuntime("idle");
      state.selectedBuildingId = targetId;
      state.routeMessage = "";
      saveProject();
    } else if (dragState.moved && targetId && targetId !== dragState.sourceId) {
      state.routeMessage = "只能连接相邻建筑，不能跨建筑连接";
    }

    dragState = null;
    state.linkDrag = null;
    renderApp();
  }
}

function createQueue(route: string[] = []): void {
  if (state.playing) return;
  const queueItem = normalizeQueue({
    id: uid("queue"),
    name: `队列${state.queues.length + 1}`,
    color: nextQueueColor(),
    fontSize: 14,
    markerSize: 18,
    route,
  });
  queueItem.runtime = createRuntime("idle");
  state.queues.push(queueItem);
  state.selectedQueueId = queueItem.id;
  state.routeSourceId = queueItem.route.root || null;
  saveProject();
  renderApp();
}

function defaultQueueRoute(): string[] {
  if (state.selectedBuildingId) return [state.selectedBuildingId];
  if (state.buildings[0]) return [state.buildings[0].id];
  return [];
}

function getRouteEdgeDraft(): Pick<RouteEdge, "step" | "pauseSeconds"> {
  const step = normalizeStep(el.routeStepInput.value || state.demoStep);
  const pauseSeconds = normalizePauseSeconds(el.routePauseInput.value);
  state.demoStep = step;
  return { step, pauseSeconds };
}

function normalizeStep(value: unknown): number {
  return clamp(Math.floor(Number(value) || 1), 1, 999);
}

function normalizePauseSeconds(value: unknown): number {
  return clamp(Number(value) || 0, 0, 600);
}

function deleteSelectedBuilding(): void {
  const building = getSelectedBuilding();
  if (!building || state.playing) return;
  state.buildings = state.buildings.filter((item) => item.id !== building.id);
  state.queues.forEach((queueItem) => {
    if (queueItem.route.root === building.id) {
      queueItem.route = { root: null, edges: [] };
    } else {
      queueItem.route.edges = queueItem.route.edges.filter((edge) => edge.fromId !== building.id && edge.toId !== building.id);
      pruneUnreachableRoute(queueItem, state.buildings);
    }
  });
  state.selectedBuildingId = state.buildings[0]?.id || null;
  saveProject();
  renderApp();
}

function deleteSelectedQueue(): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  state.queues = state.queues.filter((item) => item.id !== queueItem.id);
  state.selectedQueueId = state.queues[0]?.id || null;
  state.routeSourceId = null;
  saveProject();
  renderApp();
}

function appendRouteStep(): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  const buildingId = el.routeBuildingSelect.value;
  if (!buildingId) return;

  if (!queueItem.route.root) {
    queueItem.route.root = buildingId;
    queueItem.runtime = createRuntime("idle");
    state.selectedBuildingId = buildingId;
    state.routeSourceId = buildingId;
    state.routeMessage = "";
    saveProject();
    renderApp();
    return;
  }

  const sourceId = el.routeSourceSelect.value || getActiveRouteSourceId(queueItem, state);
  if (!canAppendRouteTarget(queueItem, buildingId, sourceId, state)) {
    state.routeMessage = "只能从路线节点连接到相邻建筑";
    renderStatus(context);
    return;
  }
  if (!sourceId) return;
  addRouteEdge(queueItem, sourceId, buildingId, state.buildings, getRouteEdgeDraft());
  queueItem.runtime = createRuntime("idle");
  state.selectedBuildingId = buildingId;
  state.routeSourceId = buildingId;
  state.routeMessage = "";
  saveProject();
  renderApp();
}

function moveRouteStep(index: number, delta: number): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= queueItem.route.edges.length) return;
  [queueItem.route.edges[index], queueItem.route.edges[nextIndex]] = [queueItem.route.edges[nextIndex], queueItem.route.edges[index]];
  queueItem.runtime = createRuntime("idle");
  saveProject();
  renderApp();
}

function removeRouteStep(index: number): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  queueItem.route.edges.splice(index, 1);
  pruneUnreachableRoute(queueItem, state.buildings);
  queueItem.runtime = createRuntime("idle");
  state.routeMessage = "";
  saveProject();
  renderApp();
}

function updateRouteEdge(index: number, patch: Partial<Pick<RouteEdge, "step" | "pauseSeconds">>): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  const edge = queueItem.route.edges[index];
  if (!edge) return;
  if (patch.step !== undefined) {
    edge.step = normalizeStep(patch.step);
    state.demoStep = edge.step;
  }
  if (patch.pauseSeconds !== undefined) {
    edge.pauseSeconds = normalizePauseSeconds(patch.pauseSeconds);
  }
  queueItem.runtime = createRuntime("idle");
  saveProject();
  renderApp();
}

function clearSelectedRoute(): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  queueItem.route = { root: null, edges: [] };
  queueItem.runtime = createRuntime("idle");
  state.routeSourceId = null;
  state.routeMessage = "";
  saveProject();
  renderApp();
}

function startDemo(activeStep: number | null): void {
  if (state.playing) return;
  state.travelDuration = clamp(Number(el.durationInput.value) || state.travelDuration, 1, 600);
  if (activeStep !== null) {
    state.demoStep = normalizeStep(activeStep);
  }
  state.activeDemoStep = activeStep === null ? null : state.demoStep;
  const selectedStep = state.activeDemoStep;
  state.queues.forEach((queueItem) => {
    const runnableEdges = queueItem.route.edges.filter((edge) => selectedStep === null || edge.step === selectedStep);
    queueItem.runtime = createRuntime(runnableEdges.length ? "running" : "finished");
    if (selectedStep !== null) {
      queueItem.route.edges
        .filter((edge) => edge.step < selectedStep)
        .forEach((edge) => {
          queueItem.runtime.startedEdgeIds.add(edge.id);
          queueItem.runtime.completedEdgeIds.add(edge.id);
        });
    }
    queueItem.runtime.runs = createEligibleRuns(queueItem, state.travelDuration, selectedStep);
    if (!queueItem.runtime.runs.length) {
      queueItem.runtime.status = "finished";
    }
  });
  state.playing = true;
  state.paused = false;
  state.lastFrame = performance.now();
  state.routeMessage = "";
  state.linkDrag = null;
  setMode("select", false);
  renderApp();
  ensureAnimationLoop();
}

function startNextStep(): void {
  if (state.playing) return;
  const maxStep = getMaxRouteStep(state.queues);
  if (state.demoStep >= maxStep) return;
  state.demoStep += 1;
  startDemo(state.demoStep);
}

function togglePause(): void {
  if (!state.playing) return;
  state.paused = !state.paused;
  state.lastFrame = performance.now();
  renderApp();
  ensureAnimationLoop();
}

function resetDemo(): void {
  state.playing = false;
  state.paused = false;
  state.activeDemoStep = null;
  state.routeMessage = "";
  state.linkDrag = null;
  state.queues.forEach((queueItem) => {
    queueItem.runtime = createRuntime("idle");
  });
  renderApp();
}

function ensureAnimationLoop(): void {
  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(tick);
  }
}

function tick(now: number): void {
  animationFrameId = 0;
  if (!state.playing) return;

  const delta = Math.min((now - state.lastFrame) / 1000, 0.2);
  state.lastFrame = now;

  if (!state.paused) {
    state.queues.forEach((queueItem) =>
      advanceQueue(queueItem, delta, state.travelDuration, state.buildings, state.activeDemoStep),
    );
    renderQueuesOnly();
    renderQueueList(context);
    renderAccelerationPanel(context);
    renderStatus(context);

    if (!state.queues.some((queueItem) => queueItem.runtime.status === "running")) {
      state.playing = false;
      renderApp();
      return;
    }
  }

  ensureAnimationLoop();
}

function accelerateSelectedQueue(rate: 0.2 | 0.5): void {
  const queueItem = getSelectedQueue();
  if (!queueItem || !state.playing || state.paused || queueItem.runtime.status !== "running") return;
  accelerateQueue(queueItem, rate);
  renderRoutesOnly();
  renderQueuesOnly();
  renderQueueList(context);
  renderAccelerationPanel(context);
  renderStatus(context);
}

function setMode(mode: "select" | "add-building", doRender = true): void {
  state.mode = mode;
  if (doRender) renderMode(context);
}

function getSelectedBuilding() {
  return state.buildings.find((item) => item.id === state.selectedBuildingId) || null;
}

function getSelectedQueue(): QueueConfig | null {
  return state.queues.find((item) => item.id === state.selectedQueueId) || null;
}

function getMapPointForBuilding(building: { x: number; y: number }): { x: number; y: number } {
  return { x: building.x, y: building.y };
}

function eventToMapPoint(event: PointerEvent): { x: number; y: number } | null {
  const rect = el.routeLayer.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}

function renderBuildingsOnly(): void {
  renderBuildings(context);
}

function nextQueueColor(): string {
  const palette = ["#d83a34", "#2267d8", "#238257", "#c58a1b", "#7b4cc2", "#c54878"];
  return palette[state.queues.length % palette.length];
}
