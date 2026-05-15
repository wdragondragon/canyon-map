import { BUILDING_HIT_RADIUS, MAP_SIZE } from "./data/defaultMap";
import { activeHistoryRows, currentAcceleration, getQueuePositions, isEdgeRunning, remainingSeconds, queueStatus, totalAcceleration } from "./animation";
import {
  getActiveRouteSourceId,
  getBuildingPoint,
  getMaxRouteStep,
  getRouteNodeIds,
  getRouteSelectBuildings,
  getRouteSourceBuildings,
  routeNodeCount,
  countSplitPoints,
  routeUsesForBuilding,
  buildingsById,
} from "./routeGraph";
import type { AppState, BuildingPoint, ElementRefs, QueueConfig } from "./types";
import { escapeHtml, tokenOffset } from "./utils";

export interface RenderActions {
  selectBuilding(id: string): void;
  selectQueue(id: string): void;
  startBuildingPointer(event: PointerEvent, buildingId: string): void;
  moveRouteStep(index: number, delta: number): void;
  removeRouteStep(index: number): void;
  updateRouteEdge(index: number, patch: { step?: number; pauseSeconds?: number }): void;
}

export interface RenderContext {
  state: AppState;
  el: ElementRefs;
  actions: RenderActions;
}

export function render(context: RenderContext): void {
  updateMapStageSize(context);
  context.el.durationInput.value = String(context.state.travelDuration);
  context.el.demoStepInput.value = String(context.state.demoStep);
  renderSceneSelect(context);
  renderMode(context);
  renderBuildings(context);
  renderRoutes(context);
  renderQueues(context);
  renderBuildingList(context);
  renderBuildingEditor(context);
  renderQueueList(context);
  renderRouteSourceSelect(context);
  renderRouteSelect(context);
  renderQueueEditor(context);
  renderRouteSteps(context);
  renderAccelerationPanel(context);
  renderStatus(context);
}

export function updateMapStageSize(context: RenderContext): void {
  const { el } = context;
  if (!el.mapStage || !el.mapPane || !el.statusStrip) return;

  const paneRect = el.mapPane.getBoundingClientRect();
  const statusRect = el.statusStrip.getBoundingClientRect();
  const paneStyle = window.getComputedStyle(el.mapPane);
  const workspaceStyle = window.getComputedStyle(el.mapPane.closest(".workspace") as Element);
  const rowGap = parseFloat(paneStyle.rowGap || paneStyle.gap) || 10;
  const bottomPadding = parseFloat(workspaceStyle.paddingBottom) || 0;
  const availableWidth = paneRect.width;
  const availableHeight = Math.max(260, window.innerHeight - paneRect.top - statusRect.height - rowGap - bottomPadding);

  if (!availableWidth || !availableHeight) return;

  const widthByHeight = (availableHeight * MAP_SIZE.width) / MAP_SIZE.height;
  const stageWidth = Math.min(availableWidth, widthByHeight);
  const stageHeight = (stageWidth * MAP_SIZE.height) / MAP_SIZE.width;

  el.mapStage.style.width = `${stageWidth}px`;
  el.mapStage.style.height = `${stageHeight}px`;
}

export function renderMode(context: RenderContext): void {
  const { el, state } = context;
  el.mapStage.classList.toggle("is-add-mode", false);
  el.mapStage.classList.toggle("is-demo-running", state.playing);
  el.selectModeBtn.classList.toggle("is-active", state.mode === "select");
  el.addBuildingModeBtn.classList.toggle("is-active", false);
  el.addBuildingModeBtn.disabled = true;
}

export function renderSceneSelect(context: RenderContext): void {
  const { el, state } = context;
  const currentValue = el.sceneSelect.value;
  el.sceneSelect.textContent = "";
  state.scenes.forEach((scene) => {
    const option = document.createElement("option");
    option.value = scene.id;
    option.textContent = scene.name;
    el.sceneSelect.appendChild(option);
  });
  if (state.scenes.some((scene) => scene.id === currentValue)) {
    el.sceneSelect.value = currentValue;
  } else if (state.selectedSceneId) {
    el.sceneSelect.value = state.selectedSceneId;
  }
}

export function renderBuildings(context: RenderContext): void {
  const { el, state } = context;
  el.buildingLayer.textContent = "";
  const queueItem = getSelectedQueue(state);
  const routeSourceId = getActiveRouteSourceId(queueItem, state);
  const routeNodeIds = queueItem ? getRouteNodeIds(queueItem) : new Set<string>();
  const connectableIds =
    routeSourceId && !state.playing
      ? new Set(getRouteSelectBuildings(queueItem, state.buildings, routeSourceId, state).map((item) => item.id))
      : new Set<string>();
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

    button.addEventListener("pointerdown", (event) => context.actions.startBuildingPointer(event, buildingItem.id));
    el.buildingLayer.appendChild(button);
  });
}

export function renderRoutes(context: RenderContext): void {
  const { el, state } = context;
  const fragment = document.createDocumentFragment();
  const buildingMap = buildingsById(state.buildings);

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

export function renderQueues(context: RenderContext): void {
  const { el, state } = context;
  const positions = state.queues.flatMap((queueItem) =>
    getQueuePositions(queueItem, state.buildings).map((position, branchIndex) => ({
      queue: queueItem,
      position,
      branchIndex,
    })),
  );
  const groups = new Map<string, number>();
  positions.forEach(({ position }) => {
    const key = `${Math.round(position.x * 1000)}:${Math.round(position.y * 1000)}`;
    groups.set(key, (groups.get(key) || 0) + 1);
  });
  const used = new Map<string, number>();

  el.queueLayer.textContent = "";
  positions.forEach(({ queue: queueItem, position, branchIndex }) => {
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
    button.title =
      positions.filter((item) => item.queue.id === queueItem.id).length > 1 ? `${queueItem.name} 分支${branchIndex + 1}` : queueItem.name;
    button.setAttribute("aria-label", `队列 ${button.title}`);
    button.classList.toggle("is-selected", queueItem.id === state.selectedQueueId);
    button.addEventListener("click", () => context.actions.selectQueue(queueItem.id));

    const marker = document.createElement("span");
    marker.className = "queue-marker";
    const label = document.createElement("span");
    label.className = "queue-label";
    label.textContent = queueItem.name;
    button.append(marker, label);
    el.queueLayer.appendChild(button);
  });
}

export function renderBuildingList(context: RenderContext): void {
  const { el, state } = context;
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
    button.addEventListener("click", () => context.actions.selectBuilding(buildingItem.id));

    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = String(routeUsesForBuilding(buildingItem.id, state.queues));

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

export function renderBuildingEditor(context: RenderContext): void {
  const { el, state } = context;
  const building = getSelectedBuilding(state);
  el.buildingEditor.classList.toggle("is-empty", !building);
  el.buildingEditor.dataset.empty = state.buildings.length ? "未选择建筑" : "暂无建筑点";
  el.buildingNameInput.value = building?.name || "";
  const disableStructural = !building || state.playing;
  el.buildingNameInput.disabled = true;
  el.addQueueAtBuildingBtn.disabled = disableStructural;
  el.deleteBuildingBtn.disabled = true;
}

export function renderQueueList(context: RenderContext): void {
  const { el, state } = context;
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
    button.addEventListener("click", () => context.actions.selectQueue(queueItem.id));

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
    meta.textContent = `${routeNodeCount(queueItem)} 点 / ${queueItem.route.edges.length} 段 / ${queueStatus(queueItem, state.paused)} / 20%×${total.twenty} 50%×${total.fifty}`;
    main.append(title, meta);

    const badge = document.createElement("span");
    badge.className = "item-badge";
    badge.textContent = queueItem.route.edges.length ? `${countSplitPoints(queueItem)}分裂` : "待定";
    button.append(color, main, badge);
    el.queueList.appendChild(button);
  });
}

export function renderQueueEditor(context: RenderContext): void {
  const { el, state } = context;
  const queueItem = getSelectedQueue(state);
  el.queueEditor.classList.toggle("is-empty", !queueItem);
  el.queueEditor.dataset.empty = state.queues.length ? "未选择队列" : "暂无行进队列";
  if (!queueItem) return;

  el.queueNameInput.value = queueItem.name;
  el.queueColorInput.value = queueItem.color;
  el.queueFontSizeInput.value = String(queueItem.fontSize);
  el.queueMarkerSizeInput.value = String(queueItem.markerSize);
  el.routeStepInput.value = String(state.demoStep);
  if (!el.routePauseInput.value) el.routePauseInput.value = "0";

  const disableStructural = state.playing;
  el.appendRouteStepBtn.disabled = disableStructural || !routeSelectHasOptions(el);
  el.clearRouteBtn.disabled = disableStructural || !queueItem.route.root;
  el.deleteQueueBtn.disabled = disableStructural;
  el.routeSourceSelect.disabled = disableStructural || !queueItem.route.root || !routeSourceSelectHasOptions(el);
  el.routeBuildingSelect.disabled = disableStructural || !routeSelectHasOptions(el);
  el.routeStepInput.disabled = disableStructural;
  el.routePauseInput.disabled = disableStructural;
}

export function renderRouteSourceSelect(context: RenderContext): void {
  const { el, state } = context;
  const queueItem = getSelectedQueue(state);
  el.routeSourceSelect.textContent = "";
  if (!queueItem?.route?.root) return;

  const options = getRouteSourceBuildings(queueItem, state.buildings, state);
  options.forEach((buildingItem) => {
    const option = document.createElement("option");
    option.value = buildingItem.id;
    option.textContent = buildingItem.name;
    el.routeSourceSelect.appendChild(option);
  });

  const activeSourceId = getActiveRouteSourceId(queueItem, state);
  if (activeSourceId && options.some((item) => item.id === activeSourceId)) {
    el.routeSourceSelect.value = activeSourceId;
  } else if (options[0]) {
    el.routeSourceSelect.value = options[0].id;
  }
}

export function renderRouteSelect(context: RenderContext): void {
  const { el, state } = context;
  const currentValue = el.routeBuildingSelect.value;
  const queueItem = getSelectedQueue(state);
  const sourceId = el.routeSourceSelect.value || getActiveRouteSourceId(queueItem, state);
  const options = getRouteSelectBuildings(queueItem, state.buildings, sourceId, state);
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
  } else if (options[0]) {
    el.routeBuildingSelect.value = options[0].id;
  }
}

export function renderRouteSteps(context: RenderContext): void {
  const { el, state } = context;
  const queueItem = getSelectedQueue(state);
  el.routeStepsList.textContent = "";
  if (!queueItem) return;
  if (!queueItem.route.root) {
    el.routeStepsList.appendChild(emptyNote("路线为空"));
    return;
  }

  const buildingMap = buildingsById(state.buildings);
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

    const stepLabel = document.createElement("label");
    const stepText = document.createElement("span");
    stepText.textContent = "步骤";
    const stepInput = document.createElement("input");
    stepInput.type = "number";
    stepInput.min = "1";
    stepInput.max = "999";
    stepInput.step = "1";
    stepInput.value = String(edge.step);
    stepInput.disabled = state.playing;
    stepInput.addEventListener("change", () => {
      context.actions.updateRouteEdge(index, { step: Number(stepInput.value) });
    });
    stepLabel.append(stepText, stepInput);

    const pauseLabel = document.createElement("label");
    const pauseText = document.createElement("span");
    pauseText.textContent = "停顿";
    const pauseInput = document.createElement("input");
    pauseInput.type = "number";
    pauseInput.min = "0";
    pauseInput.max = "600";
    pauseInput.step = "0.5";
    pauseInput.value = String(edge.pauseSeconds);
    pauseInput.disabled = state.playing;
    pauseInput.addEventListener("change", () => {
      context.actions.updateRouteEdge(index, { pauseSeconds: Number(pauseInput.value) });
    });
    pauseLabel.append(pauseText, pauseInput);

    const up = routeButton("上移", () => context.actions.moveRouteStep(index, -1));
    up.disabled = true;
    const down = routeButton("下移", () => context.actions.moveRouteStep(index, 1));
    down.disabled = true;
    const remove = routeButton("删除", () => context.actions.removeRouteStep(index));
    remove.disabled = state.playing;

    row.append(stepIndex, name, stepLabel, pauseLabel, up, down, remove);
    el.routeStepsList.appendChild(row);
  });
}

export function renderAccelerationPanel(context: RenderContext): void {
  const { el, state } = context;
  const queueItem = getSelectedQueue(state);
  const canAccelerate =
    queueItem !== null &&
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

  renderSegmentLog(context, queueItem);
}

export function renderSegmentLog(context: RenderContext, queueItem: QueueConfig): void {
  const { el, state } = context;
  el.segmentLog.textContent = "";
  const buildingMap = buildingsById(state.buildings);
  const rows = activeHistoryRows(queueItem);

  if (!rows.length) {
    el.segmentLog.appendChild(emptyNote("暂无行进记录"));
    return;
  }

  rows.slice(-8).forEach((row) => {
    const item = document.createElement("div");
    item.className = "log-row";
    const route = document.createElement("span");
    route.className = "log-route";
    const fromName = buildingMap.get(row.fromId)?.name || (row as { fromName?: string }).fromName || "未知";
    const toName = buildingMap.get(row.toId)?.name || (row as { toName?: string }).toName || "未知";
    route.textContent = `${fromName} -> ${toName}${"active" in row && row.active ? " / 进行中" : ""}`;
    const count = document.createElement("span");
    count.className = "log-count";
    count.textContent = `20%×${row.twenty} 50%×${row.fifty}`;
    item.append(route, count);
    el.segmentLog.appendChild(item);
  });
}

export function renderStatus(context: RenderContext): void {
  const { el, state } = context;
  const selectedBuilding = getSelectedBuilding(state);
  const selectedQueue = getSelectedQueue(state);
  const selectedScene = state.scenes.find((scene) => scene.id === state.selectedSceneId) || null;
  const selection = [
    selectedScene ? `场景 ${selectedScene.name}` : null,
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
    const stepText = state.activeDemoStep === null ? "" : ` / 步骤 ${state.activeDemoStep}`;
    el.progressStatus.textContent = moving ? `${moving} 支队列行进中${stepText}` : `演示完成${stepText}`;
  }

  const hasRoute = state.queues.some((queueItem) => queueItem.route.edges.length > 0);
  const hasSelectedStep = state.queues.some((queueItem) => queueItem.route.edges.some((edge) => edge.step === state.demoStep));
  const maxStep = getMaxRouteStep(state.queues);
  el.startBtn.disabled = state.playing || !hasRoute;
  el.startStepBtn.disabled = state.playing || !hasSelectedStep;
  el.nextStepBtn.disabled = state.playing || !hasRoute || state.demoStep >= maxStep;
  el.pauseBtn.disabled = !state.playing;
  el.pauseBtn.textContent = state.paused ? "继续" : "暂停";
  el.resetBtn.disabled = !state.playing && state.queues.every((queueItem) => queueItem.runtime.status === "idle");
  el.durationInput.disabled = state.playing;
  el.demoStepInput.disabled = state.playing;
  el.sceneSelect.disabled = state.playing;
  el.createSceneBtn.disabled = state.playing;
  el.deleteSceneBtn.disabled = state.playing || state.scenes.length <= 1;
  el.createQueueBtn.disabled = state.playing;
  el.loadSampleBtn.disabled = state.playing;
  el.clearProjectBtn.disabled = state.playing;
}

function getSelectedBuilding(state: AppState): BuildingPoint | null {
  return state.buildings.find((item) => item.id === state.selectedBuildingId) || null;
}

function getSelectedQueue(state: AppState): QueueConfig | null {
  return state.queues.find((item) => item.id === state.selectedQueueId) || null;
}

function routeButton(text: string, handler: () => void): HTMLButtonElement {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = text;
  button.addEventListener("click", handler);
  return button;
}

function emptyNote(text: string): HTMLDivElement {
  const note = document.createElement("div");
  note.className = "empty-note";
  note.textContent = text;
  return note;
}

function routeSelectHasOptions(el: ElementRefs): boolean {
  return Boolean(el.routeBuildingSelect && el.routeBuildingSelect.options.length);
}

function routeSourceSelectHasOptions(el: ElementRefs): boolean {
  return Boolean(el.routeSourceSelect && el.routeSourceSelect.options.length);
}

export function findBuildingIdAtPoint(el: ElementRefs, clientX: number, clientY: number): string | null {
  const direct = document
    .elementsFromPoint(clientX, clientY)
    .map((element) => element.closest(".building-point"))
    .find(Boolean) as HTMLElement | undefined;
  if (direct?.dataset.buildingId) return direct.dataset.buildingId;

  const stageRect = el.mapStage.getBoundingClientRect();
  const stageScale = Math.min(stageRect.width / MAP_SIZE.width, stageRect.height / MAP_SIZE.height);
  const hitRadius = Math.min(38, Math.max(18, BUILDING_HIT_RADIUS * stageScale));
  let nearestId: string | null = null;
  let nearestDistance = hitRadius;
  document.querySelectorAll<HTMLElement>(".building-point").forEach((element) => {
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
