export type QueueStatus = "idle" | "running" | "finished";
export type AppMode = "select" | "add-building";

export interface Point {
  x: number;
  y: number;
}

export interface BuildingPoint extends Point {
  id: string;
  name: string;
  fixed: boolean;
}

export interface RouteEdge {
  id: string;
  fromId: string;
  toId: string;
  step: number;
  pauseSeconds: number;
}

export interface RouteGraph {
  root: string | null;
  edges: RouteEdge[];
}

export interface QueueAccelCount {
  twenty: number;
  fifty: number;
}

export interface QueueRun {
  id: string;
  edgeId: string;
  fromId: string;
  toId: string;
  step: number;
  phase: "moving" | "waiting";
  elapsed: number;
  segmentDuration: number;
  currentAccel: QueueAccelCount;
}

export interface QueueHistoryEntry extends QueueAccelCount {
  fromId: string;
  toId: string;
  fromName: string;
  toName: string;
  step: number;
  active?: boolean;
  waiting?: boolean;
}

export interface QueueRuntime {
  status: QueueStatus;
  runs: QueueRun[];
  history: QueueHistoryEntry[];
  startedEdgeIds: Set<string>;
  completedEdgeIds: Set<string>;
}

export interface QueueConfig {
  id: string;
  name: string;
  color: string;
  fontSize: number;
  markerSize: number;
  route: RouteGraph;
  runtime: QueueRuntime;
}

export interface StoredQueueConfig {
  id: string;
  name: string;
  color: string;
  fontSize: number;
  markerSize: number;
  route: RouteGraph;
}

export interface SceneConfig {
  id: string;
  name: string;
  selectedQueueId: string | null;
  queues: QueueConfig[];
}

export interface StoredSceneConfig {
  id: string;
  name: string;
  selectedQueueId: string | null;
  queues: StoredQueueConfig[];
}

export interface ProjectData {
  version: 2;
  travelDuration: number;
  selectedBuildingId: string | null;
  selectedSceneId: string | null;
  selectedQueueId: string | null;
  buildings: BuildingPoint[];
  scenes: SceneConfig[];
  queues: QueueConfig[];
}

export interface StoredProjectData {
  version: 2;
  travelDuration: number;
  selectedBuildingId: string | null;
  selectedSceneId: string | null;
  selectedQueueId: string | null;
  buildings: BuildingPoint[];
  scenes: StoredSceneConfig[];
  queues: StoredQueueConfig[];
}

export interface QueueDraft {
  id?: string;
  name?: string;
  color?: string;
  fontSize?: number;
  markerSize?: number;
  route?: unknown;
}

export interface ProjectDraft {
  version?: number;
  travelDuration?: unknown;
  selectedBuildingId?: unknown;
  selectedSceneId?: unknown;
  selectedQueueId?: unknown;
  buildings?: unknown;
  scenes?: unknown;
  queues?: unknown;
}

export interface LinkDragState {
  sourceId: string;
  x: number;
  y: number;
  targetId: string | null;
}

export interface AppState {
  buildings: BuildingPoint[];
  scenes: SceneConfig[];
  selectedSceneId: string | null;
  queues: QueueConfig[];
  selectedBuildingId: string | null;
  selectedQueueId: string | null;
  routeSourceId: string | null;
  mode: AppMode;
  travelDuration: number;
  demoStep: number;
  activeDemoStep: number | null;
  playing: boolean;
  paused: boolean;
  lastFrame: number;
  routeMessage: string;
  linkDrag: LinkDragState | null;
}

export interface ElementRefs {
  selectModeBtn: HTMLButtonElement;
  addBuildingModeBtn: HTMLButtonElement;
  durationInput: HTMLInputElement;
  demoStepInput: HTMLInputElement;
  startBtn: HTMLButtonElement;
  startStepBtn: HTMLButtonElement;
  nextStepBtn: HTMLButtonElement;
  pauseBtn: HTMLButtonElement;
  resetBtn: HTMLButtonElement;
  mapStage: HTMLDivElement;
  routeLayer: SVGSVGElement;
  queueLayer: HTMLDivElement;
  buildingLayer: HTMLDivElement;
  selectionStatus: HTMLSpanElement;
  progressStatus: HTMLSpanElement;
  countStatus: HTMLSpanElement;
  sceneSelect: HTMLSelectElement;
  createSceneBtn: HTMLButtonElement;
  deleteSceneBtn: HTMLButtonElement;
  loadSampleBtn: HTMLButtonElement;
  clearProjectBtn: HTMLButtonElement;
  buildingEditor: HTMLDivElement;
  buildingNameInput: HTMLInputElement;
  addQueueAtBuildingBtn: HTMLButtonElement;
  deleteBuildingBtn: HTMLButtonElement;
  buildingList: HTMLDivElement;
  createQueueBtn: HTMLButtonElement;
  queueList: HTMLDivElement;
  queueEditor: HTMLDivElement;
  queueNameInput: HTMLInputElement;
  queueColorInput: HTMLInputElement;
  queueFontSizeInput: HTMLInputElement;
  queueMarkerSizeInput: HTMLInputElement;
  routeSourceSelect: HTMLSelectElement;
  routeBuildingSelect: HTMLSelectElement;
  routeStepInput: HTMLInputElement;
  routePauseInput: HTMLInputElement;
  appendRouteStepBtn: HTMLButtonElement;
  routeStepsList: HTMLDivElement;
  clearRouteBtn: HTMLButtonElement;
  deleteQueueBtn: HTMLButtonElement;
  accel20Btn: HTMLButtonElement;
  accel50Btn: HTMLButtonElement;
  accelStats: HTMLDivElement;
  segmentLog: HTMLDivElement;
  mapPane: HTMLElement;
  statusStrip: HTMLElement;
}
