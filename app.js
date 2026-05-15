const STORAGE_KEY = "canyon-sand-table-v2";
const MAP_SIZE = { width: 1470, height: 1080 };
const BUILDING_MARKER_OFFSET_Y = 26;
const BUILDING_HIT_RADIUS = 42;
const MAX_ROUTE_OUTGOING = 2;

const DEFAULT_BUILDINGS = [
  bp("s1", "S1", 83, 369),
  bp("s2", "S2", 198, 286),
  bp("s3", "S3", 181, 382),
  bp("s4", "S4", 151, 442),
  bp("s5", "S5", 310, 188),
  bp("s6", "S6", 248, 306),
  bp("s7", "S7", 238, 420),
  bp("s8", "S8", 216, 505),
  bp("s9", "S9", 414, 138),
  bp("s10", "S10", 304, 276),
  bp("s11", "S11", 293, 433),
  bp("s12", "S12", 305, 568),
  bp("s13", "S13", 540, 143),
  bp("s14", "S14", 423, 196),
  bp("s15", "S15", 357, 323),
  bp("s16", "S16", 350, 397),
  bp("s17", "S17", 366, 517),
  bp("s18", "S18", 222, 619),
  bp("s19", "S19", 229, 788),
  bp("s20", "S20", 622, 163),
  bp("s21", "S21", 432, 286),
  bp("s22", "S22", 407, 376),
  bp("s23", "S23", 431, 479),
  bp("s24", "S24", 554, 259),
  bp("s25", "S25", 496, 319),
  bp("s26", "S26", 507, 400),
  bp("s27", "S27", 459, 536),
  bp("s28", "S28", 679, 272),
  bp("s29", "S29", 572, 349),
  bp("s30", "S30", 636, 356),
  bp("s31", "S31", 588, 430),

  bp("f1", "F1", 1377, 370),
  bp("f2", "F2", 1289, 437),
  bp("f3", "F3", 1293, 390),
  bp("f4", "F4", 1234, 268),
  bp("f5", "F5", 1234, 486),
  bp("f6", "F6", 1224, 398),
  bp("f7", "F7", 1223, 339),
  bp("f8", "F8", 1132, 203),
  bp("f9", "F9", 1150, 572),
  bp("f10", "F10", 1161, 427),
  bp("f11", "F11", 1163, 305),
  bp("f12", "F12", 1014, 162),
  bp("f13", "F13", 1075, 612),
  bp("f14", "F14", 1083, 504),
  bp("f15", "F15", 1104, 386),
  bp("f16", "F16", 1096, 339),
  bp("f17", "F17", 1075, 241),
  bp("f18", "F18", 908, 164),
  bp("f19", "F19", 1155, 661),
  bp("f20", "F20", 1001, 575),
  bp("f21", "F21", 1006, 450),
  bp("f22", "F22", 1039, 382),
  bp("f23", "F23", 1025, 278),
  bp("f24", "F24", 961, 497),
  bp("f25", "F25", 946, 398),
  bp("f26", "F26", 944, 321),
  bp("f27", "F27", 912, 258),
  bp("f28", "F28", 972, 604),
  bp("f29", "F29", 879, 338),
  bp("f30", "F30", 874, 447),
  bp("f31", "F31", 807, 330),

  bp("i1", "I1", 735, 1033),
  bp("i2", "I2", 616, 935),
  bp("i3", "I3", 725, 916),
  bp("i4", "I4", 824, 938),
  bp("i5", "I5", 532, 885),
  bp("i6", "I6", 676, 895),
  bp("i7", "I7", 797, 894),
  bp("i8", "I8", 931, 890),
  bp("i9", "I9", 466, 840),
  bp("i10", "I10", 610, 833),
  bp("i11", "I11", 866, 831),
  bp("i12", "I12", 1009, 839),
  bp("i13", "I13", 373, 801),
  bp("i14", "I14", 529, 801),
  bp("i15", "I15", 682, 806),
  bp("i16", "I16", 792, 807),
  bp("i17", "I17", 945, 800),
  bp("i18", "I18", 1110, 789),
  bp("i19", "I19", 230, 768),
  bp("i20", "I20", 436, 730),
  bp("i21", "I21", 593, 735),
  bp("i22", "I22", 742, 757),
  bp("i23", "I23", 878, 738),
  bp("i24", "I24", 514, 676),
  bp("i25", "I25", 644, 701),
  bp("i26", "I26", 817, 691),
  bp("i27", "I27", 963, 724),
  bp("i28", "I28", 617, 618),
  bp("i29", "I29", 722, 647),
  bp("i30", "I30", 669, 585),
  bp("i31", "I31", 805, 586),
  bp("i100", "I100", 735, 497),
];

const DEFAULT_LINKS = [
  ["s1", "s2"], ["s1", "s3"], ["s1", "s4"], ["s2", "s5"], ["s2", "s10"],
  ["s3", "s6"], ["s3", "s7"], ["s4", "s8"], ["s5", "s9"], ["s5", "s10"],
  ["s6", "s10"], ["s6", "s15"], ["s7", "s8"], ["s7", "s11"], ["s8", "s12"],
  ["s9", "s13"], ["s9", "s14"], ["s10", "s15"], ["s11", "s12"], ["s11", "s16"],
  ["s12", "s17"], ["s12", "s18"], ["s13", "s20"], ["s14", "s21"],
  ["s15", "s16"], ["s15", "s21"], ["s16", "s17"], ["s16", "s22"], ["s16", "s23"], ["s17", "s23"],
  ["s18", "i19"], ["s19", "s20"], ["s20", "s24"], ["s21", "s22"],
  ["s21", "s24"], ["s21", "s25"], ["s22", "s23"], ["s22", "s25"], ["s23", "s26"],
  ["s23", "s27"], ["s24", "s25"], ["s24", "s28"], ["s25", "s29"], ["s26", "s29"],
  ["s26", "s31"], ["s27", "i24"], ["s28", "s30"], ["s29", "s30"], ["s29", "s31"],
  ["s30", "s31"], ["s30", "i100"], ["s31", "i30"],

  ["f1", "f2"], ["f1", "f3"], ["f1", "f4"], ["f2", "f5"], ["f3", "f6"],
  ["f3", "f7"], ["f4", "f7"], ["f4", "f8"], ["f4", "f11"], ["f5", "f9"],
  ["f5", "f10"], ["f6", "f10"], ["f6", "f15"], ["f7", "f11"], ["f8", "f12"],
  ["f9", "f13"], ["f9", "f14"], ["f10", "f14"], ["f10", "f15"], ["f11", "f16"],
  ["f11", "f23"], ["f12", "f18"], ["f12", "f17"], ["f13", "f19"], ["f13", "f20"],
  ["f14", "f21"], ["f15", "f16"], ["f15", "f22"], ["f16", "f22"],
  ["f16", "f23"], ["f17", "f23"], ["f18", "f27"], ["f20", "f24"], ["f20", "f28"],
  ["f21", "f22"], ["f21", "f24"], ["f22", "f23"], ["f22", "f25"], ["f23", "f26"],
  ["f23", "f27"], ["f24", "f25"], ["f24", "f28"], ["f24", "f30"], ["f24", "i100"],
  ["f25", "f26"], ["f25", "f29"], ["f25", "f30"], ["f26", "f27"], ["f26", "f29"],
  ["f27", "f29"], ["f28", "i27"], ["f29", "f30"], ["f29", "f31"],
  ["f30", "f31"], ["f31", "i31"], ["f19", "i18"],

  ["i1", "i2"], ["i1", "i3"], ["i1", "i4"], ["i2", "i5"], ["i3", "i6"],
  ["i3", "i7"], ["i4", "i8"], ["i5", "i9"], ["i6", "i10"],
  ["i7", "i8"], ["i7", "i11"], ["i8", "i12"], ["i9", "i13"], ["i10", "i15"],
  ["i11", "i16"], ["i11", "i12"], ["i12", "i17"], ["i12", "i18"], ["i13", "i19"],
  ["i13", "i20"], ["i9", "i14"], ["i14", "i21"], ["i15", "i16"], ["i15", "i21"],
  ["i15", "i22"], ["i16", "i17"], ["i16", "i22"], ["i16", "i23"], ["i17", "i23"],
  ["i20", "i24"], ["i21", "i22"], ["i21", "i25"], ["i22", "i23"], ["i22", "i25"],
  ["i22", "i26"], ["i23", "i26"], ["i23", "i27"], ["i24", "i28"], ["i25", "i29"],
  ["i26", "i29"], ["i26", "i31"], ["i28", "i30"], ["i29", "i30"], ["i29", "i31"],
  ["i30", "i100"], ["i31", "i100"],
];

const LINK_LOOKUP = createLinkLookup(DEFAULT_LINKS);

const el = {};
const state = {
  buildings: [],
  queues: [],
  selectedBuildingId: null,
  selectedQueueId: null,
  routeSourceId: null,
  mode: "select",
  travelDuration: 8,
  playing: false,
  paused: false,
  lastFrame: 0,
  routeMessage: "",
  linkDrag: null,
};

let animationFrameId = 0;
let dragState = null;

document.addEventListener("DOMContentLoaded", () => {
  bindElements();
  bindEvents();
  loadProject();
  updateMapStageSize();
  render();
  window.requestAnimationFrame(updateMapStageSize);
});

function bindElements() {
  [
    "selectModeBtn",
    "addBuildingModeBtn",
    "durationInput",
    "startBtn",
    "pauseBtn",
    "resetBtn",
    "mapStage",
    "routeLayer",
    "queueLayer",
    "buildingLayer",
    "selectionStatus",
    "progressStatus",
    "countStatus",
    "loadSampleBtn",
    "clearProjectBtn",
    "buildingEditor",
    "buildingNameInput",
    "addQueueAtBuildingBtn",
    "deleteBuildingBtn",
    "buildingList",
    "createQueueBtn",
    "queueList",
    "queueEditor",
    "queueNameInput",
    "queueColorInput",
    "queueFontSizeInput",
    "queueMarkerSizeInput",
    "routeSourceSelect",
    "routeBuildingSelect",
    "appendRouteStepBtn",
    "routeStepsList",
    "clearRouteBtn",
    "deleteQueueBtn",
    "accel20Btn",
    "accel50Btn",
    "accelStats",
    "segmentLog",
  ].forEach((id) => {
    el[id] = document.getElementById(id);
  });
  el.mapPane = document.querySelector(".map-pane");
  el.statusStrip = document.querySelector(".status-strip");
}

function bindEvents() {
  window.addEventListener("resize", updateMapStageSize);
  el.selectModeBtn.addEventListener("click", () => setMode("select"));
  el.addBuildingModeBtn.addEventListener("click", () => setMode("select"));
  el.durationInput.addEventListener("change", () => {
    state.travelDuration = clamp(Number(el.durationInput.value) || 8, 1, 600);
    el.durationInput.value = String(state.travelDuration);
    saveProject();
    renderStatus();
  });

  el.startBtn.addEventListener("click", startDemo);
  el.pauseBtn.addEventListener("click", togglePause);
  el.resetBtn.addEventListener("click", resetDemo);

  el.mapStage.addEventListener("click", () => {
    state.routeMessage = "";
  });

  el.loadSampleBtn.addEventListener("click", () => {
    if (state.playing) return;
    applyProject(createSampleProject());
    saveProject();
    render();
  });

  el.clearProjectBtn.addEventListener("click", () => {
    if (state.playing) return;
    if (!window.confirm("清空当前队列配置？固定建筑点会保留。")) return;
    applyProject({
      buildings: DEFAULT_BUILDINGS,
      queues: [],
      selectedBuildingId: null,
      selectedQueueId: null,
      travelDuration: state.travelDuration,
    });
    saveProject();
    render();
  });

  el.buildingNameInput.addEventListener("input", () => {
    const building = getSelectedBuilding();
    if (!building) return;
    building.name = el.buildingNameInput.value.trim() || "未命名建筑";
    saveProject();
    renderBuildingList();
    renderRoutes();
    renderQueues();
    renderRouteSelect();
    renderRouteSteps();
    renderStatus();
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
    renderQueueList();
    renderQueues();
    renderStatus();
  });

  el.queueColorInput.addEventListener("input", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.color = el.queueColorInput.value;
    saveProject();
    renderQueueList();
    renderRoutes();
    renderQueues();
  });

  el.queueFontSizeInput.addEventListener("change", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.fontSize = clamp(Number(el.queueFontSizeInput.value) || 14, 10, 32);
    saveProject();
    renderQueues();
    renderQueueEditor();
  });

  el.queueMarkerSizeInput.addEventListener("change", () => {
    const queue = getSelectedQueue();
    if (!queue) return;
    queue.markerSize = clamp(Number(el.queueMarkerSizeInput.value) || 18, 10, 36);
    saveProject();
    renderQueues();
    renderQueueEditor();
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
    render();
  });

  el.appendRouteStepBtn.addEventListener("click", appendRouteStep);
  el.clearRouteBtn.addEventListener("click", clearSelectedRoute);
  el.deleteQueueBtn.addEventListener("click", deleteSelectedQueue);
  el.accel20Btn.addEventListener("click", () => accelerateSelectedQueue(0.2));
  el.accel50Btn.addEventListener("click", () => accelerateSelectedQueue(0.5));
}

function loadProject() {
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    applyProject(createSampleProject());
    saveProject();
    return;
  }

  try {
    applyProject(JSON.parse(raw));
  } catch {
    applyProject(createSampleProject());
    saveProject();
  }
}

function applyProject(project) {
  state.buildings = mergeDefaultBuildings(project.buildings);
  state.queues = Array.isArray(project.queues) ? project.queues.map(normalizeQueue) : [];
  state.travelDuration = clamp(Number(project.travelDuration) || 8, 1, 600);
  state.selectedBuildingId = state.buildings.some((item) => item.id === project.selectedBuildingId)
    ? project.selectedBuildingId
    : state.buildings[0]?.id || null;
  state.selectedQueueId = state.queues.some((item) => item.id === project.selectedQueueId)
    ? project.selectedQueueId
    : state.queues[0]?.id || null;
  state.mode = "select";
  state.playing = false;
  state.paused = false;
  state.lastFrame = 0;
  state.routeMessage = "";
  state.linkDrag = null;
  state.routeSourceId = null;
}

function saveProject() {
  const payload = {
    version: 2,
    travelDuration: state.travelDuration,
    selectedBuildingId: state.selectedBuildingId,
    selectedQueueId: state.selectedQueueId,
    buildings: state.buildings.map(({ id, name, x, y, fixed }) => ({ id, name, x, y, fixed })),
    queues: state.queues.map(({ id, name, color, fontSize, markerSize, route }) => ({
      id,
      name,
      color,
      fontSize,
      markerSize,
      route: serializeRoute(route),
    })),
  };
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function normalizeBuilding(building) {
  return {
    id: String(building.id || uid("building")),
    name: String(building.name || "未命名建筑"),
    x: clamp(Number(building.x) || 0.5, 0, 1),
    y: clamp(Number(building.y) || 0.5, 0, 1),
    fixed: building.fixed !== false,
  };
}

function normalizeQueue(queue) {
  const queueItem = {
    id: String(queue.id || uid("queue")),
    name: String(queue.name || "未命名队列"),
    color: /^#[0-9a-f]{6}$/i.test(queue.color) ? queue.color : "#d84a3a",
    fontSize: clamp(Number(queue.fontSize) || 14, 10, 32),
    markerSize: clamp(Number(queue.markerSize) || 18, 10, 36),
    route: normalizeRoute(queue.route),
    runtime: createRuntime("idle"),
  };
  pruneUnreachableRoute(queueItem);
  return queueItem;
}

function normalizeRoute(route) {
  if (Array.isArray(route)) {
    const ids = route.map(String).filter(Boolean);
    return {
      root: ids[0] || null,
      edges: ids
        .slice(0, -1)
        .map((fromId, index) => ({
          id: uid("edge"),
          fromId,
          toId: ids[index + 1],
        }))
        .filter((edge) => isLinkedBuildings(edge.fromId, edge.toId)),
    };
  }

  if (route && typeof route === "object") {
    const root = route.root ? String(route.root) : null;
    const seen = new Set();
    const edges = Array.isArray(route.edges)
      ? route.edges
          .map((edge) => ({
            id: String(edge.id || uid("edge")),
            fromId: String(edge.fromId || ""),
            toId: String(edge.toId || ""),
          }))
          .filter((edge) => {
            const key = `${edge.fromId}->${edge.toId}`;
            if (
              !edge.fromId ||
              !edge.toId ||
              edge.fromId === edge.toId ||
              seen.has(key) ||
              !isLinkedBuildings(edge.fromId, edge.toId)
            ) {
              return false;
            }
            seen.add(key);
            return true;
          })
      : [];
    return { root, edges };
  }

  return { root: null, edges: [] };
}

function serializeRoute(route) {
  const normalized = normalizeRoute(route);
  return {
    root: normalized.root,
    edges: normalized.edges.map(({ id, fromId, toId }) => ({ id, fromId, toId })),
  };
}

function createRuntime(status = "idle") {
  return {
    status,
    runs: [],
    history: [],
    startedEdgeIds: new Set(),
    completedEdgeIds: new Set(),
  };
}

function createSampleProject() {
  return {
    travelDuration: 8,
    selectedBuildingId: "s1",
    selectedQueueId: "q-red",
    buildings: DEFAULT_BUILDINGS,
    queues: [
      queue("q-red", "先锋一队", "#d83a34", 15, 19, [
        "s1",
        "s2",
        "s10",
        "s15",
        "s21",
        "s24",
        "s28",
        "s30",
        "i100",
      ]),
      queue("q-blue", "北线增援", "#2267d8", 14, 18, ["f1", "f3", "f6", "f10", "f15", "f22", "f23", "f27", "f18"]),
      queue("q-green", "南线牵制", "#238257", 13, 17, ["i1", "i3", "i6", "i10", "i15", "i21", "i25", "i29", "i30"]),
      queue("q-gold", "中路压制", "#c58a1b", 14, 18, ["f9", "f14", "f21", "f24", "i100"]),
    ],
  };
}

function bp(id, name, x, y) {
  return {
    id,
    name,
    x: x / MAP_SIZE.width,
    y: y / MAP_SIZE.height,
    fixed: true,
  };
}

function createLinkLookup(links) {
  const lookup = new Map();
  links.forEach(([fromId, toId]) => {
    if (!lookup.has(fromId)) lookup.set(fromId, new Set());
    if (!lookup.has(toId)) lookup.set(toId, new Set());
    lookup.get(fromId).add(toId);
    lookup.get(toId).add(fromId);
  });
  return lookup;
}

function mergeDefaultBuildings(savedBuildings = []) {
  const savedNames = new Map(
    (Array.isArray(savedBuildings) ? savedBuildings : []).map((item) => [String(item.id), String(item.name || "")]),
  );
  return DEFAULT_BUILDINGS.map((item) => ({
    ...item,
    name: savedNames.get(item.id) || item.name,
    fixed: true,
  }));
}

function building(id, name, x, y) {
  return { id, name, x, y, fixed: true };
}

function queue(id, name, color, fontSize, markerSize, route) {
  return { id, name, color, fontSize, markerSize, route };
}

function render() {
  updateMapStageSize();
  el.durationInput.value = String(state.travelDuration);
  renderMode();
  renderBuildings();
  renderRoutes();
  renderQueues();
  renderBuildingList();
  renderBuildingEditor();
  renderQueueList();
  renderRouteSourceSelect();
  renderRouteSelect();
  renderQueueEditor();
  renderRouteSteps();
  renderAccelerationPanel();
  renderStatus();
}

function updateMapStageSize() {
  if (!el.mapStage || !el.mapPane || !el.statusStrip) return;

  const paneRect = el.mapPane.getBoundingClientRect();
  const statusRect = el.statusStrip.getBoundingClientRect();
  const paneStyle = window.getComputedStyle(el.mapPane);
  const workspaceStyle = window.getComputedStyle(el.mapPane.closest(".workspace"));
  const rowGap = parseFloat(paneStyle.rowGap || paneStyle.gap) || 10;
  const bottomPadding = parseFloat(workspaceStyle.paddingBottom) || 0;
  const availableWidth = paneRect.width;
  const availableHeight = Math.max(
    260,
    window.innerHeight - paneRect.top - statusRect.height - rowGap - bottomPadding,
  );

  if (!availableWidth || !availableHeight) return;

  const widthByHeight = (availableHeight * MAP_SIZE.width) / MAP_SIZE.height;
  const stageWidth = Math.min(availableWidth, widthByHeight);
  const stageHeight = (stageWidth * MAP_SIZE.height) / MAP_SIZE.width;

  el.mapStage.style.width = `${stageWidth}px`;
  el.mapStage.style.height = `${stageHeight}px`;
}

function renderMode() {
  el.mapStage.classList.toggle("is-add-mode", false);
  el.selectModeBtn.classList.toggle("is-active", state.mode === "select");
  el.addBuildingModeBtn.classList.toggle("is-active", false);
  el.addBuildingModeBtn.disabled = true;
}

function renderBuildings() {
  el.buildingLayer.textContent = "";
  const queueItem = getSelectedQueue();
  const routeSourceId = getActiveRouteSourceId(queueItem);
  const routeNodeIds = queueItem ? getRouteNodeIds(queueItem) : new Set();
  const connectableIds =
    routeSourceId && !state.playing
      ? new Set(getRouteSelectBuildings(queueItem, routeSourceId).map((item) => item.id))
      : new Set();
  const linkTargetId = state.linkDrag?.targetId || null;

  state.buildings.forEach((buildingItem) => {
    const point = getBuildingPoint(buildingItem);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "building-point";
    button.dataset.buildingId = buildingItem.id;
    button.style.left = `${point.x * 100}%`;
    button.style.top = `${point.y * 100}%`;
    button.title = buildingItem.name;
    button.setAttribute("aria-label", `建筑 ${buildingItem.name}`);
    button.classList.toggle("is-selected", buildingItem.id === state.selectedBuildingId);
    button.classList.toggle("is-route-node", routeNodeIds.has(buildingItem.id));
    button.classList.toggle("is-route-tail", buildingItem.id === routeSourceId);
    button.classList.toggle("is-connectable", connectableIds.has(buildingItem.id));
    button.classList.toggle("is-link-target", buildingItem.id === linkTargetId);

    const label = document.createElement("span");
    label.className = "building-label";
    label.textContent = buildingItem.name;
    button.appendChild(label);

    button.addEventListener("pointerdown", (event) => startBuildingPointer(event, buildingItem.id));
    el.buildingLayer.appendChild(button);
  });
}

function renderRoutes() {
  const fragment = document.createDocumentFragment();
  const buildingMap = buildingsById();

  state.queues.forEach((queueItem) => {
    queueItem.route.edges.forEach((edge, index) => {
      const from = buildingMap.get(edge.fromId);
      const to = buildingMap.get(edge.toId);
      if (!from || !to) return;
      const fromPoint = getBuildingPoint(from);
      const toPoint = getBuildingPoint(to);
      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", String(fromPoint.x * MAP_SIZE.width));
      line.setAttribute("y1", String(fromPoint.y * MAP_SIZE.height));
      line.setAttribute("x2", String(toPoint.x * MAP_SIZE.width));
      line.setAttribute("y2", String(toPoint.y * MAP_SIZE.height));
      line.setAttribute("stroke", queueItem.color);
      line.setAttribute("stroke-dasharray", index === 0 ? "0" : "10 12");
      line.classList.add("route-line");
      if (queueItem.id === state.selectedQueueId || isEdgeRunning(queueItem, edge)) {
        line.classList.add("is-active");
      }
      fragment.appendChild(line);
    });
  });

  if (state.linkDrag) {
    const from = buildingMap.get(state.linkDrag.sourceId);
    if (from) {
      const fromPoint = getBuildingPoint(from);
      const preview = document.createElementNS("http://www.w3.org/2000/svg", "line");
      preview.setAttribute("x1", String(fromPoint.x * MAP_SIZE.width));
      preview.setAttribute("y1", String(fromPoint.y * MAP_SIZE.height));
      preview.setAttribute("x2", String(state.linkDrag.x * MAP_SIZE.width));
      preview.setAttribute("y2", String(state.linkDrag.y * MAP_SIZE.height));
      preview.classList.add("link-preview-line");
      preview.classList.toggle("is-valid", Boolean(state.linkDrag.targetId));
      fragment.appendChild(preview);
    }
  }

  el.routeLayer.textContent = "";
  el.routeLayer.appendChild(fragment);
}

function renderQueues() {
  const positions = state.queues.flatMap((queueItem) =>
    getQueuePositions(queueItem).map((position, branchIndex) => ({
      queue: queueItem,
      position,
      branchIndex,
    })),
  );
  const groups = new Map();
  positions.forEach(({ position }) => {
    if (!position) return;
    const key = `${Math.round(position.x * 1000)}:${Math.round(position.y * 1000)}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  const used = new Map();

  el.queueLayer.textContent = "";
  positions.forEach(({ queue: queueItem, position, branchIndex }) => {
    if (!position) return;
    const key = `${Math.round(position.x * 1000)}:${Math.round(position.y * 1000)}`;
    const offsetIndex = used.get(key) || 0;
    used.set(key, offsetIndex + 1);
    const offset = tokenOffset(offsetIndex, groups.get(key) || 1);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "queue-token";
    button.style.left = `${position.x * 100}%`;
    button.style.top = `${position.y * 100}%`;
    button.style.setProperty("--queue-color", queueItem.color);
    button.style.setProperty("--queue-font-size", `${queueItem.fontSize}px`);
    button.style.setProperty("--marker-size", `${queueItem.markerSize}px`);
    button.style.transform = `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`;
    button.title = positions.filter((item) => item.queue.id === queueItem.id).length > 1 ? `${queueItem.name} 分支${branchIndex + 1}` : queueItem.name;
    button.setAttribute("aria-label", `队列 ${button.title}`);
    button.classList.toggle("is-selected", queueItem.id === state.selectedQueueId);
    button.addEventListener("click", () => {
      state.selectedQueueId = queueItem.id;
      state.routeSourceId = null;
      saveProject();
      render();
    });

    const marker = document.createElement("span");
    marker.className = "queue-marker";
    const label = document.createElement("span");
    label.className = "queue-label";
    label.textContent = queueItem.name;
    button.append(marker, label);
    el.queueLayer.appendChild(button);
  });
}

function renderBuildingList() {
  el.buildingList.textContent = "";
  if (!state.buildings.length) {
    el.buildingList.appendChild(emptyNote("暂无建筑点"));
    return;
  }

  state.buildings.forEach((buildingItem) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    button.classList.toggle("is-selected", buildingItem.id === state.selectedBuildingId);
    button.addEventListener("click", () => {
      state.selectedBuildingId = buildingItem.id;
      saveProject();
      render();
    });

    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = String(routeUsesForBuilding(buildingItem.id));

    const main = document.createElement("span");
    main.className = "item-main";
    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = buildingItem.name;
    const meta = document.createElement("span");
    meta.className = "item-meta";
    meta.textContent = `${Math.round(buildingItem.x * MAP_SIZE.width)}, ${Math.round(buildingItem.y * MAP_SIZE.height)}`;
    main.append(title, meta);

    const action = document.createElement("span");
    action.className = "item-meta";
    action.textContent = "选择";
    button.append(badge, main, action);
    el.buildingList.appendChild(button);
  });
}

function renderBuildingEditor() {
  const building = getSelectedBuilding();
  el.buildingEditor.classList.toggle("is-empty", !building);
  el.buildingEditor.dataset.empty = state.buildings.length ? "未选择建筑" : "暂无建筑点";
  el.buildingNameInput.value = building?.name || "";
  const disableStructural = !building || state.playing;
  el.buildingNameInput.disabled = true;
  el.addQueueAtBuildingBtn.disabled = disableStructural;
  el.deleteBuildingBtn.disabled = true;
}

function renderQueueList() {
  el.queueList.textContent = "";
  if (!state.queues.length) {
    el.queueList.appendChild(emptyNote("暂无行进队列"));
    return;
  }

  state.queues.forEach((queueItem) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "list-item";
    button.classList.toggle("is-selected", queueItem.id === state.selectedQueueId);
    button.addEventListener("click", () => {
      state.selectedQueueId = queueItem.id;
      state.routeSourceId = null;
      saveProject();
      render();
    });

    const color = document.createElement("span");
    color.className = "color-dot";
    color.style.setProperty("--dot-color", queueItem.color);

    const main = document.createElement("span");
    main.className = "item-main";
    const title = document.createElement("span");
    title.className = "item-title";
    title.textContent = queueItem.name;
    const meta = document.createElement("span");
    meta.className = "item-meta";
    const total = totalAcceleration(queueItem);
    meta.textContent = `${routeNodeCount(queueItem)} 点 / ${queueItem.route.edges.length} 段 / ${queueStatus(queueItem)} / 20%×${total.twenty} 50%×${total.fifty}`;
    main.append(title, meta);

    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = queueItem.route.edges.length ? `${countSplitPoints(queueItem)}分裂` : "待定";
    button.append(color, main, badge);
    el.queueList.appendChild(button);
  });
}

function renderQueueEditor() {
  const queueItem = getSelectedQueue();
  el.queueEditor.classList.toggle("is-empty", !queueItem);
  el.queueEditor.dataset.empty = state.queues.length ? "未选择队列" : "暂无行进队列";
  if (!queueItem) return;

  el.queueNameInput.value = queueItem.name;
  el.queueColorInput.value = queueItem.color;
  el.queueFontSizeInput.value = String(queueItem.fontSize);
  el.queueMarkerSizeInput.value = String(queueItem.markerSize);

  const disableStructural = state.playing;
  el.appendRouteStepBtn.disabled = disableStructural || !routeSelectHasOptions();
  el.clearRouteBtn.disabled = disableStructural || !queueItem.route.root;
  el.deleteQueueBtn.disabled = disableStructural;
  el.routeSourceSelect.disabled = disableStructural || !queueItem.route.root || !routeSourceSelectHasOptions();
  el.routeBuildingSelect.disabled = disableStructural || !routeSelectHasOptions();
}

function renderRouteSourceSelect() {
  const queueItem = getSelectedQueue();
  el.routeSourceSelect.textContent = "";
  if (!queueItem?.route?.root) return;

  const options = getRouteSourceBuildings(queueItem);
  options.forEach((buildingItem) => {
    const option = document.createElement("option");
    option.value = buildingItem.id;
    option.textContent = buildingItem.name;
    el.routeSourceSelect.appendChild(option);
  });

  const activeSourceId = getActiveRouteSourceId(queueItem);
  if (options.some((item) => item.id === activeSourceId)) {
    el.routeSourceSelect.value = activeSourceId;
  } else if (options[0]) {
    el.routeSourceSelect.value = options[0].id;
  }
}

function renderRouteSelect() {
  const currentValue = el.routeBuildingSelect.value;
  const queueItem = getSelectedQueue();
  const options = getRouteSelectBuildings(queueItem);
  el.routeBuildingSelect.textContent = "";
  options.forEach((buildingItem) => {
    const option = document.createElement("option");
    option.value = buildingItem.id;
    option.textContent = buildingItem.name;
    el.routeBuildingSelect.appendChild(option);
  });
  if (options.some((item) => item.id === currentValue)) {
    el.routeBuildingSelect.value = currentValue;
  } else if (state.selectedBuildingId && options.some((item) => item.id === state.selectedBuildingId)) {
    el.routeBuildingSelect.value = state.selectedBuildingId;
  }
}

function renderRouteSteps() {
  const queueItem = getSelectedQueue();
  el.routeStepsList.textContent = "";
  if (!queueItem) return;
  if (!queueItem.route.root) {
    el.routeStepsList.appendChild(emptyNote("路线为空"));
    return;
  }

  const buildingMap = buildingsById();
  const rootRow = document.createElement("div");
  rootRow.className = "route-step route-root";
  const rootIndex = document.createElement("span");
  rootIndex.className = "step-index";
  rootIndex.textContent = "起";
  const rootName = document.createElement("span");
  rootName.className = "step-name";
  rootName.textContent = buildingMap.get(queueItem.route.root)?.name || "已删除建筑";
  const rootHint = document.createElement("span");
  rootHint.className = "step-action-hint";
  rootHint.textContent = "可从路线节点拖出分支";
  rootRow.append(rootIndex, rootName, rootHint);
  el.routeStepsList.appendChild(rootRow);

  queueItem.route.edges.forEach((edge, index) => {
    const row = document.createElement("div");
    row.className = "route-step";

    const stepIndex = document.createElement("span");
    stepIndex.className = "step-index";
    stepIndex.textContent = String(index + 1);

    const name = document.createElement("span");
    name.className = "step-name";
    const fromName = buildingMap.get(edge.fromId)?.name || "已删除建筑";
    const toName = buildingMap.get(edge.toId)?.name || "已删除建筑";
    name.textContent = `${fromName} -> ${toName}`;

    const up = routeButton("上移", () => moveRouteStep(index, -1));
    up.disabled = true;
    const down = routeButton("下移", () => moveRouteStep(index, 1));
    down.disabled = true;
    const remove = routeButton("删除", () => removeRouteStep(index));
    remove.disabled = state.playing;

    row.append(stepIndex, name, up, down, remove);
    el.routeStepsList.appendChild(row);
  });
}

function renderAccelerationPanel() {
  const queueItem = getSelectedQueue();
  const canAccelerate =
    Boolean(queueItem) &&
    state.playing &&
    !state.paused &&
    queueItem.runtime.status === "running" &&
    queueItem.runtime.runs.length > 0;
  el.accel20Btn.disabled = !canAccelerate;
  el.accel50Btn.disabled = !canAccelerate;

  if (!queueItem) {
    el.accelStats.textContent = "未选择队列";
    el.segmentLog.textContent = "";
    return;
  }

  const current = currentAcceleration(queueItem);
  const total = totalAcceleration(queueItem);
  const remaining = queueItem.runtime.status === "running" ? remainingSeconds(queueItem).toFixed(1) : "0.0";
  el.accelStats.innerHTML = [
    `<strong>${escapeHtml(queueItem.name)}</strong>`,
    `当前分支 ${queueItem.runtime.runs.length} 路 / 最短剩余 ${remaining} 秒`,
    `本段 20%×${current.twenty} / 50%×${current.fifty}`,
    `累计 20%×${total.twenty} / 50%×${total.fifty}`,
  ].join("<br />");

  renderSegmentLog(queueItem);
}

function renderSegmentLog(queueItem) {
  el.segmentLog.textContent = "";
  const buildingMap = buildingsById();
  const rows = [...queueItem.runtime.history];
  if (queueItem.runtime.status === "running") {
    queueItem.runtime.runs.forEach((run) => {
      rows.push({
        fromId: run.fromId,
        toId: run.toId,
        twenty: run.currentAccel.twenty,
        fifty: run.currentAccel.fifty,
        active: true,
      });
    });
  }

  if (!rows.length) {
    el.segmentLog.appendChild(emptyNote("暂无行进记录"));
    return;
  }

  rows.slice(-8).forEach((row) => {
    const item = document.createElement("div");
    item.className = "log-row";
    const route = document.createElement("span");
    route.className = "log-route";
    const fromName = buildingMap.get(row.fromId)?.name || row.fromName || "未知";
    const toName = buildingMap.get(row.toId)?.name || row.toName || "未知";
    route.textContent = `${fromName} -> ${toName}${row.active ? " / 进行中" : ""}`;
    const count = document.createElement("span");
    count.className = "log-count";
    count.textContent = `20%×${row.twenty} 50%×${row.fifty}`;
    item.append(route, count);
    el.segmentLog.appendChild(item);
  });
}

function renderStatus() {
  const selectedBuilding = getSelectedBuilding();
  const selectedQueue = getSelectedQueue();
  const selection = [
    selectedBuilding ? `建筑 ${selectedBuilding.name}` : null,
    selectedQueue ? `队列 ${selectedQueue.name}` : null,
  ].filter(Boolean);

  el.selectionStatus.textContent = selection.length ? selection.join(" / ") : "未选择";
  el.countStatus.textContent = `${state.buildings.length} 建筑 / ${state.queues.length} 队列`;

  if (state.routeMessage) {
    el.progressStatus.textContent = state.routeMessage;
  } else if (!state.playing) {
    el.progressStatus.textContent = "待命";
  } else if (state.paused) {
    el.progressStatus.textContent = "已暂停";
  } else {
    const moving = state.queues.filter((queueItem) => queueItem.runtime.status === "running").length;
    el.progressStatus.textContent = moving ? `${moving} 支队列行进中` : "演示完成";
  }

  el.startBtn.disabled = state.playing || !state.queues.some((queueItem) => queueItem.route.edges.length > 0);
  el.pauseBtn.disabled = !state.playing;
  el.pauseBtn.textContent = state.paused ? "继续" : "暂停";
  el.resetBtn.disabled = !state.playing && state.queues.every((queueItem) => queueItem.runtime.status === "idle");
  el.durationInput.disabled = state.playing;
  el.createQueueBtn.disabled = state.playing;
  el.loadSampleBtn.disabled = state.playing;
  el.clearProjectBtn.disabled = state.playing;
}

function addBuildingAtEvent(event) {
  const point = eventToMapPoint(event);
  if (!point) return;
  const nextNumber = state.buildings.length + 1;
  const buildingItem = {
    id: uid("building"),
    name: `建筑${nextNumber}`,
    x: point.x,
    y: point.y,
  };
  state.buildings.push(buildingItem);
  state.selectedBuildingId = buildingItem.id;
  saveProject();
  render();
}

function startBuildingPointer(event, buildingId) {
  event.preventDefault();
  event.stopPropagation();
  state.selectedBuildingId = buildingId;
  state.routeSourceId = buildingId;
  state.routeMessage = "";

  const queueItem = getSelectedQueue();
  if (!canStartRouteLink(queueItem, buildingId)) {
    saveProject();
    render();
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
  state.linkDrag = {
    sourceId: buildingId,
    x: eventToMapPoint(event)?.x || getBuildingPoint(getSelectedBuilding())?.x || 0,
    y: eventToMapPoint(event)?.y || getBuildingPoint(getSelectedBuilding())?.y || 0,
    targetId: null,
  };

  window.addEventListener("pointermove", handleRouteLinkDrag);
  window.addEventListener("pointerup", finishRouteLinkDrag, { once: true });
  render();
}

function handleRouteLinkDrag(event) {
  if (!dragState) return;
  if (event.pointerId !== dragState.pointerId) return;

  const dx = event.clientX - dragState.startClientX;
  const dy = event.clientY - dragState.startClientY;
  if (Math.hypot(dx, dy) > 3) dragState.moved = true;

  const point = eventToMapPoint(event);
  if (!point) return;

  const targetId = findBuildingIdAtPoint(event.clientX, event.clientY);
  state.linkDrag = {
    sourceId: dragState.sourceId,
    x: point.x,
    y: point.y,
    targetId: targetId && canAppendRouteTarget(getSelectedQueue(), targetId, dragState.sourceId) ? targetId : null,
  };
  renderRoutes();
  renderBuildings();
  renderStatus();
}

function finishRouteLinkDrag(event) {
  window.removeEventListener("pointermove", handleRouteLinkDrag);
  if (dragState) {
    const queueItem = getSelectedQueue();
    const targetId = findBuildingIdAtPoint(event.clientX, event.clientY);
    if (dragState.moved && queueItem && targetId && canAppendRouteTarget(queueItem, targetId, dragState.sourceId)) {
      addRouteEdge(queueItem, dragState.sourceId, targetId);
      queueItem.runtime = createRuntime("idle");
      state.selectedBuildingId = targetId;
      state.routeMessage = "";
      saveProject();
    } else if (dragState.moved && targetId && targetId !== dragState.sourceId) {
      state.routeMessage = "只能连接相邻建筑，不能跨建筑连接";
    }

    dragState = null;
    state.linkDrag = null;
    render();
  }
}

function createQueue(route = []) {
  if (state.playing) return;
  const queueItem = normalizeQueue({
    id: uid("queue"),
    name: `队列${state.queues.length + 1}`,
    color: nextQueueColor(),
    fontSize: 14,
    markerSize: 18,
    route,
  });
  state.queues.push(queueItem);
  state.selectedQueueId = queueItem.id;
  state.routeSourceId = queueItem.route.root || null;
  saveProject();
  render();
}

function defaultQueueRoute() {
  if (state.selectedBuildingId) return [state.selectedBuildingId];
  if (state.buildings[0]) return [state.buildings[0].id];
  return [];
}

function deleteSelectedBuilding() {
  const building = getSelectedBuilding();
  if (!building || state.playing) return;
  state.buildings = state.buildings.filter((item) => item.id !== building.id);
  state.queues.forEach((queueItem) => {
    if (queueItem.route.root === building.id) {
      queueItem.route = { root: null, edges: [] };
    } else {
      queueItem.route.edges = queueItem.route.edges.filter(
        (edge) => edge.fromId !== building.id && edge.toId !== building.id,
      );
      pruneUnreachableRoute(queueItem);
    }
  });
  state.selectedBuildingId = state.buildings[0]?.id || null;
  saveProject();
  render();
}

function deleteSelectedQueue() {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  state.queues = state.queues.filter((item) => item.id !== queueItem.id);
  state.selectedQueueId = state.queues[0]?.id || null;
  state.routeSourceId = null;
  saveProject();
  render();
}

function appendRouteStep() {
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
    render();
    return;
  }

  const sourceId = el.routeSourceSelect.value || getActiveRouteSourceId(queueItem);
  if (!canAppendRouteTarget(queueItem, buildingId, sourceId)) {
    state.routeMessage = "只能从路线节点连接到相邻建筑；同一点最多两个去处";
    renderStatus();
    return;
  }
  addRouteEdge(queueItem, sourceId, buildingId);
  queueItem.runtime = createRuntime("idle");
  state.selectedBuildingId = buildingId;
  state.routeSourceId = buildingId;
  state.routeMessage = "";
  saveProject();
  render();
}

function moveRouteStep(index, delta) {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  const nextIndex = index + delta;
  if (nextIndex < 0 || nextIndex >= queueItem.route.edges.length) return;
  [queueItem.route.edges[index], queueItem.route.edges[nextIndex]] = [
    queueItem.route.edges[nextIndex],
    queueItem.route.edges[index],
  ];
  queueItem.runtime = createRuntime("idle");
  saveProject();
  render();
}

function removeRouteStep(index) {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  queueItem.route.edges.splice(index, 1);
  pruneUnreachableRoute(queueItem);
  queueItem.runtime = createRuntime("idle");
  state.routeMessage = "";
  saveProject();
  render();
}

function clearSelectedRoute() {
  const queueItem = getSelectedQueue();
  if (!queueItem || state.playing) return;
  queueItem.route = { root: null, edges: [] };
  queueItem.runtime = createRuntime("idle");
  state.routeSourceId = null;
  state.routeMessage = "";
  saveProject();
  render();
}

function startDemo() {
  if (state.playing) return;
  state.travelDuration = clamp(Number(el.durationInput.value) || state.travelDuration, 1, 600);
  state.queues.forEach((queueItem) => {
    queueItem.runtime = createRuntime(queueItem.route.edges.length ? "running" : "finished");
    queueItem.runtime.runs = createEligibleRuns(queueItem);
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
  render();
  ensureAnimationLoop();
}

function togglePause() {
  if (!state.playing) return;
  state.paused = !state.paused;
  state.lastFrame = performance.now();
  render();
  ensureAnimationLoop();
}

function resetDemo() {
  state.playing = false;
  state.paused = false;
  state.routeMessage = "";
  state.linkDrag = null;
  state.queues.forEach((queueItem) => {
    queueItem.runtime = createRuntime("idle");
  });
  render();
}

function ensureAnimationLoop() {
  if (!animationFrameId) {
    animationFrameId = window.requestAnimationFrame(tick);
  }
}

function tick(now) {
  animationFrameId = 0;
  if (!state.playing) return;

  const delta = Math.min((now - state.lastFrame) / 1000, 0.2);
  state.lastFrame = now;

  if (!state.paused) {
    state.queues.forEach((queueItem) => advanceQueue(queueItem, delta));
    renderRoutes();
    renderQueues();
    renderQueueList();
    renderAccelerationPanel();
    renderStatus();

    if (!state.queues.some((queueItem) => queueItem.runtime.status === "running")) {
      state.playing = false;
      render();
      return;
    }
  }

  ensureAnimationLoop();
}

function advanceQueue(queueItem, delta) {
  const runtime = queueItem.runtime;
  ensureRuntimeSets(runtime);
  if (runtime.status !== "running") return;
  if (!runtime.runs.length) {
    runtime.status = "finished";
    return;
  }

  const nextRuns = [];
  let maxOverrun = 0;
  runtime.runs.forEach((run) => {
    run.elapsed += delta;
    if (run.elapsed < run.segmentDuration) {
      nextRuns.push(run);
      return;
    }

    const overrun = run.elapsed - run.segmentDuration;
    maxOverrun = Math.max(maxOverrun, overrun);
    recordSegment(queueItem, run);
    runtime.completedEdgeIds.add(run.edgeId);
  });

  runtime.runs = nextRuns;
  createEligibleRuns(queueItem).forEach((run) => {
    run.elapsed = Math.min(maxOverrun, run.segmentDuration);
    runtime.runs.push(run);
  });
  if (!runtime.runs.length) runtime.status = "finished";
}

function recordSegment(queueItem, run) {
  const buildingMap = buildingsById();
  queueItem.runtime.history.push({
    fromId: run.fromId,
    toId: run.toId,
    fromName: buildingMap.get(run.fromId)?.name || "未知",
    toName: buildingMap.get(run.toId)?.name || "未知",
    twenty: run.currentAccel.twenty,
    fifty: run.currentAccel.fifty,
  });
}

function accelerateSelectedQueue(rate) {
  const queueItem = getSelectedQueue();
  if (!queueItem || !state.playing || state.paused || queueItem.runtime.status !== "running") return;
  queueItem.runtime.runs.forEach((run) => {
    const remaining = run.segmentDuration - run.elapsed;
    if (remaining <= 0.05) return;
    run.segmentDuration = run.elapsed + remaining * (1 - rate);
    if (rate === 0.2) run.currentAccel.twenty += 1;
    if (rate === 0.5) run.currentAccel.fifty += 1;
  });
  renderRoutes();
  renderQueues();
  renderQueueList();
  renderAccelerationPanel();
  renderStatus();
}

function setMode(mode, doRender = true) {
  state.mode = mode;
  if (doRender) renderMode();
}

function getSelectedBuilding() {
  return state.buildings.find((item) => item.id === state.selectedBuildingId) || null;
}

function getSelectedQueue() {
  return state.queues.find((item) => item.id === state.selectedQueueId) || null;
}

function getBuildingPoint(building) {
  if (!building) return null;
  return {
    x: building.x,
    y: clamp(building.y - BUILDING_MARKER_OFFSET_Y / MAP_SIZE.height, 0, 1),
  };
}

function getRouteNodeIds(queueItem) {
  const ids = new Set();
  if (!queueItem?.route?.root) return ids;
  ids.add(queueItem.route.root);
  queueItem.route.edges.forEach((edge) => {
    ids.add(edge.fromId);
    ids.add(edge.toId);
  });
  return ids;
}

function getOutgoingEdges(queueItem, sourceId) {
  if (!queueItem || !sourceId) return [];
  return queueItem.route.edges.filter((edge) => edge.fromId === sourceId);
}

function routeNodeCount(queueItem) {
  return getRouteNodeIds(queueItem).size;
}

function countSplitPoints(queueItem) {
  if (!queueItem?.route?.root) return 0;
  return [...getRouteNodeIds(queueItem)].filter((nodeId) => getOutgoingEdges(queueItem, nodeId).length > 1).length;
}

function getRouteTailIds(queueItem) {
  if (!queueItem?.route?.root) return [];
  const nodes = getRouteNodeIds(queueItem);
  return [...nodes].filter((id) => getOutgoingEdges(queueItem, id).length === 0);
}

function getActiveRouteSourceId(queueItem) {
  if (!queueItem?.route?.root) return null;
  if (state.routeSourceId && getRouteNodeIds(queueItem).has(state.routeSourceId)) {
    return state.routeSourceId;
  }
  if (state.selectedBuildingId && getRouteNodeIds(queueItem).has(state.selectedBuildingId)) {
    return state.selectedBuildingId;
  }
  return getRouteTailIds(queueItem)[0] || queueItem.route.root;
}

function getLinkedBuildingIds(buildingId) {
  return [...(LINK_LOOKUP.get(buildingId) || [])];
}

function isLinkedBuildings(fromId, toId) {
  return Boolean(fromId && toId && LINK_LOOKUP.get(fromId)?.has(toId));
}

function canStartRouteLink(queueItem, buildingId) {
  return Boolean(
    !state.playing &&
      queueItem?.route?.root &&
      getRouteNodeIds(queueItem).has(buildingId) &&
      getOutgoingEdges(queueItem, buildingId).length < MAX_ROUTE_OUTGOING,
  );
}

function canAppendRouteTarget(queueItem, buildingId, sourceId = getActiveRouteSourceId(queueItem)) {
  if (!queueItem || !buildingId || state.playing) return false;
  if (!queueItem.route.root) return true;
  if (!sourceId || sourceId === buildingId) return false;
  if (!getRouteNodeIds(queueItem).has(sourceId)) return false;
  if (getOutgoingEdges(queueItem, sourceId).length >= MAX_ROUTE_OUTGOING) return false;
  if (getOutgoingEdges(queueItem, sourceId).some((edge) => edge.toId === buildingId)) return false;
  return isLinkedBuildings(sourceId, buildingId);
}

function addRouteEdge(queueItem, fromId, toId) {
  if (!queueItem || !fromId || !toId) return false;
  if (!queueItem.route.root) {
    queueItem.route.root = fromId;
  }
  if (!canAppendRouteTarget(queueItem, toId, fromId)) return false;
  queueItem.route.edges.push({
    id: uid("edge"),
    fromId,
    toId,
  });
  pruneUnreachableRoute(queueItem);
  return true;
}

function pruneUnreachableRoute(queueItem) {
  if (!queueItem?.route?.root) {
    if (queueItem?.route) queueItem.route.edges = [];
    return;
  }

  const buildings = buildingsById();
  if (!buildings.has(queueItem.route.root)) {
    queueItem.route = { root: null, edges: [] };
    return;
  }

  const reachable = new Set([queueItem.route.root]);
  let changed = true;
  while (changed) {
    changed = false;
    queueItem.route.edges.forEach((edge) => {
      if (!reachable.has(edge.fromId) || !buildings.has(edge.toId) || reachable.has(edge.toId)) return;
      reachable.add(edge.toId);
      changed = true;
    });
  }

  queueItem.route.edges = queueItem.route.edges.filter(
    (edge) => reachable.has(edge.fromId) && reachable.has(edge.toId) && buildings.has(edge.toId),
  );
}

function ensureRuntimeSets(runtime) {
  if (!(runtime.startedEdgeIds instanceof Set)) {
    runtime.startedEdgeIds = new Set(runtime.startedEdgeIds || []);
  }
  if (!(runtime.completedEdgeIds instanceof Set)) {
    runtime.completedEdgeIds = new Set(runtime.completedEdgeIds || []);
  }
}

function createEligibleRuns(queueItem) {
  const runtime = queueItem.runtime;
  ensureRuntimeSets(runtime);
  return queueItem.route.edges
    .map((edge, index) => ({ edge, index }))
    .filter(({ edge, index }) => canStartRouteEdge(queueItem, edge, index))
    .map(({ edge }) => {
      runtime.startedEdgeIds.add(edge.id);
      return {
        id: uid("run"),
        edgeId: edge.id,
        fromId: edge.fromId,
        toId: edge.toId,
        elapsed: 0,
        segmentDuration: state.travelDuration,
        currentAccel: { twenty: 0, fifty: 0 },
      };
    });
}

function canStartRouteEdge(queueItem, edge, edgeIndex) {
  const runtime = queueItem.runtime;
  if (runtime.startedEdgeIds.has(edge.id) || runtime.completedEdgeIds.has(edge.id)) return false;

  const earlierIncoming = queueItem.route.edges
    .map((candidate, index) => ({ edge: candidate, index }))
    .filter((item) => item.edge.toId === edge.fromId && item.index < edgeIndex);
  const sourceHasBeenReached =
    edge.fromId === queueItem.route.root || earlierIncoming.some((item) => runtime.completedEdgeIds.has(item.edge.id));

  return sourceHasBeenReached && earlierIncoming.every((item) => runtime.completedEdgeIds.has(item.edge.id));
}

function isEdgeRunning(queueItem, edge) {
  return Boolean(
    queueItem?.runtime?.status === "running" &&
      queueItem.runtime.runs.some((run) => run.edgeId === edge.id || (run.fromId === edge.fromId && run.toId === edge.toId)),
  );
}

function getRouteSelectBuildings(queueItem, sourceId = getActiveRouteSourceId(queueItem)) {
  if (!queueItem || !queueItem.route.root) return state.buildings;
  const ids = new Set(getLinkedBuildingIds(sourceId));
  return state.buildings.filter((item) => ids.has(item.id) && canAppendRouteTarget(queueItem, item.id, sourceId));
}

function getRouteSourceBuildings(queueItem) {
  if (!queueItem?.route?.root) return [];
  const nodeIds = [...getRouteNodeIds(queueItem)];
  return state.buildings.filter((item) => nodeIds.includes(item.id) && getRouteSelectBuildings(queueItem, item.id).length > 0);
}

function routeSourceSelectHasOptions() {
  return Boolean(el.routeSourceSelect && el.routeSourceSelect.options.length);
}

function routeSelectHasOptions() {
  return Boolean(el.routeBuildingSelect && el.routeBuildingSelect.options.length);
}

function findBuildingIdAtPoint(clientX, clientY) {
  const direct = document
    .elementsFromPoint(clientX, clientY)
    .map((element) => element.closest(".building-point"))
    .find(Boolean);
  if (direct?.dataset.buildingId) return direct.dataset.buildingId;

  const stageRect = el.mapStage.getBoundingClientRect();
  const stageScale = Math.min(stageRect.width / MAP_SIZE.width, stageRect.height / MAP_SIZE.height);
  const hitRadius = clamp(BUILDING_HIT_RADIUS * stageScale, 18, 38);
  let nearestId = null;
  let nearestDistance = hitRadius;
  document.querySelectorAll(".building-point").forEach((element) => {
    const rect = element.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const distance = Math.hypot(clientX - centerX, clientY - centerY);
    if (distance <= nearestDistance) {
      nearestDistance = distance;
      nearestId = element.dataset.buildingId || null;
    }
  });
  return nearestId;
}

function buildingsById() {
  return new Map(state.buildings.map((item) => [item.id, item]));
}

function getQueuePositions(queueItem) {
  const buildingMap = buildingsById();
  if (!queueItem.route.root || !buildingMap.has(queueItem.route.root)) return [];

  const runtime = queueItem.runtime;
  if (runtime.status === "running" && runtime.runs.length) {
    return runtime.runs
      .map((run) => {
        const from = buildingMap.get(run.fromId);
        const to = buildingMap.get(run.toId);
        if (!from || !to) return null;
        const fromPoint = getBuildingPoint(from);
        const toPoint = getBuildingPoint(to);
        const progress = clamp(run.elapsed / Math.max(run.segmentDuration, 0.01), 0, 1);
        return {
          x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
          y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
        };
      })
      .filter(Boolean);
  }

  const tails = getRouteTailIds(queueItem);
  const targetIds = runtime.status === "finished" && tails.length ? tails : [queueItem.route.root];
  return targetIds
    .map((targetId) => {
  const target = buildingMap.get(targetId);
      return target ? getBuildingPoint(target) : null;
    })
    .filter(Boolean);
}

function eventToMapPoint(event) {
  const rect = el.routeLayer.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  return {
    x: clamp((event.clientX - rect.left) / rect.width, 0, 1),
    y: clamp((event.clientY - rect.top) / rect.height, 0, 1),
  };
}

function tokenOffset(index, count) {
  if (count <= 1) return { x: 0, y: 0 };
  const radius = 18 + Math.min(count, 5) * 2;
  const angle = (Math.PI * 2 * index) / count - Math.PI / 2;
  return {
    x: Math.cos(angle) * radius,
    y: Math.sin(angle) * radius,
  };
}

function routeUsesForBuilding(buildingId) {
  return state.queues.reduce((total, queueItem) => {
    if (!queueItem.route.root) return total;
    let count = queueItem.route.root === buildingId ? 1 : 0;
    queueItem.route.edges.forEach((edge) => {
      if (edge.fromId === buildingId) count += 1;
      if (edge.toId === buildingId) count += 1;
    });
    return total + count;
  }, 0);
}

function routeButton(text, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

function emptyNote(text) {
  const note = document.createElement("div");
  note.className = "empty-note";
  note.textContent = text;
  return note;
}

function queueStatus(queueItem) {
  if (state.paused && queueItem.runtime.status === "running") return "暂停";
  const statusMap = {
    idle: "待命",
    running: "行进",
    finished: "完成",
  };
  return statusMap[queueItem.runtime.status] || "待命";
}

function remainingSeconds(queueItem) {
  if (queueItem.runtime.status !== "running") return 0;
  if (!queueItem.runtime.runs.length) return 0;
  return Math.min(
    ...queueItem.runtime.runs.map((run) => Math.max(0, run.segmentDuration - run.elapsed)),
  );
}

function currentAcceleration(queueItem) {
  return queueItem.runtime.runs.reduce(
    (total, run) => {
      total.twenty += run.currentAccel.twenty;
      total.fifty += run.currentAccel.fifty;
      return total;
    },
    { twenty: 0, fifty: 0 },
  );
}

function totalAcceleration(queueItem) {
  const active = currentAcceleration(queueItem);
  return queueItem.runtime.history.reduce(
    (total, row) => {
      total.twenty += row.twenty;
      total.fifty += row.fifty;
      return total;
    },
    active,
  );
}

function nextQueueColor() {
  const palette = ["#d83a34", "#2267d8", "#238257", "#c58a1b", "#7b4cc2", "#c54878"];
  return palette[state.queues.length % palette.length];
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
