import {
  BUILDING_MARKER_OFFSET_Y,
  DEFAULT_BUILDINGS,
  DEFAULT_LINKS,
  MAP_SIZE,
} from "./data/defaultMap";
import { createRuntime } from "./state";
import type { AppState, BuildingPoint, Point, QueueConfig, RouteEdge, RouteGraph } from "./types";
import { clamp, isRecord, uid } from "./utils";

type LinkLookup = Map<string, Set<string>>;

export function createLinkLookup(links: ReadonlyArray<readonly [string, string]>): LinkLookup {
  const lookup: LinkLookup = new Map();
  links.forEach(([fromId, toId]) => {
    if (!lookup.has(fromId)) lookup.set(fromId, new Set());
    if (!lookup.has(toId)) lookup.set(toId, new Set());
    lookup.get(fromId)?.add(toId);
    lookup.get(toId)?.add(fromId);
  });
  return lookup;
}

export const DEFAULT_LINK_LOOKUP = createLinkLookup(DEFAULT_LINKS);

export function buildingsById(buildings: BuildingPoint[]): Map<string, BuildingPoint> {
  return new Map(buildings.map((item) => [item.id, item]));
}

export function normalizeBuilding(building: unknown): BuildingPoint | null {
  if (!isRecord(building)) return null;
  const id = String(building.id ?? "").trim();
  if (!id) return null;
  return {
    id,
    name: String(building.name ?? "未命名建筑"),
    x: clamp(Number(building.x) || 0.5, 0, 1),
    y: clamp(Number(building.y) || 0.5, 0, 1),
    fixed: building.fixed !== false,
  };
}

export function mergeDefaultBuildings(savedBuildings: unknown): BuildingPoint[] {
  const saved = Array.isArray(savedBuildings)
    ? savedBuildings.map(normalizeBuilding).filter((item): item is BuildingPoint => Boolean(item))
    : [];
  const savedById = new Map(saved.map((item) => [item.id, item]));
  const defaultIds = new Set(DEFAULT_BUILDINGS.map((item) => item.id));
  const mergedDefaults = DEFAULT_BUILDINGS.map((item) => {
    const savedItem = savedById.get(item.id);
    return {
      ...item,
      name: savedItem?.name || item.name,
      fixed: true,
    };
  });
  const extras = saved.filter((item) => !defaultIds.has(item.id));
  return [...mergedDefaults, ...extras];
}

export function isLinkedBuildings(fromId: string | null | undefined, toId: string | null | undefined): boolean {
  return Boolean(fromId && toId && DEFAULT_LINK_LOOKUP.get(fromId)?.has(toId));
}

export function getLinkedBuildingIds(buildingId: string | null | undefined): string[] {
  if (!buildingId) return [];
  return [...(DEFAULT_LINK_LOOKUP.get(buildingId) ?? [])];
}

export function normalizeRoute(route: unknown): RouteGraph {
  if (Array.isArray(route)) {
    const ids = route.map((value) => String(value || "").trim()).filter(Boolean);
    return {
      root: ids[0] ?? null,
      edges: ids
        .slice(0, -1)
        .map((fromId, index) => ({
          id: uid("edge"),
          fromId,
          toId: ids[index + 1],
          step: 1,
          pauseSeconds: 0,
        }))
        .filter((edge) => isLinkedBuildings(edge.fromId, edge.toId)),
    };
  }

  if (!isRecord(route)) return { root: null, edges: [] };

  const root = route.root ? String(route.root) : null;
  const seen = new Set<string>();
  const edges = Array.isArray(route.edges)
    ? route.edges
        .map((edge): RouteEdge | null => {
          if (!isRecord(edge)) return null;
          const fromId = String(edge.fromId || "");
          const toId = String(edge.toId || "");
          return {
            id: String(edge.id || uid("edge")),
            fromId,
            toId,
            step: clamp(Math.floor(Number(edge.step) || 1), 1, 999),
            pauseSeconds: clamp(Number(edge.pauseSeconds) || 0, 0, 600),
          };
        })
        .filter((edge): edge is RouteEdge => {
          if (!edge) return false;
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

export function serializeRoute(route: RouteGraph): RouteGraph {
  const normalized = normalizeRoute(route);
  return {
    root: normalized.root,
    edges: normalized.edges.map(({ id, fromId, toId, step, pauseSeconds }) => ({ id, fromId, toId, step, pauseSeconds })),
  };
}

export function normalizeQueue(queue: unknown): QueueConfig {
  const record = isRecord(queue) ? queue : {};
  const color = String(record.color || "");
  return {
    id: String(record.id || uid("queue")),
    name: String(record.name || "未命名队列"),
    color: /^#[0-9a-f]{6}$/i.test(color) ? color : "#d84a3a",
    fontSize: clamp(Number(record.fontSize) || 14, 10, 32),
    markerSize: clamp(Number(record.markerSize) || 18, 10, 36),
    route: normalizeRoute(record.route),
    runtime: createRuntime("idle"),
  };
}

export function getBuildingPoint(building: BuildingPoint): Point {
  return {
    x: building.x,
    y: clamp(building.y - BUILDING_MARKER_OFFSET_Y / MAP_SIZE.height, 0, 1),
  };
}

export function getRouteNodeIds(queueItem: Pick<QueueConfig, "route"> | null | undefined): Set<string> {
  const ids = new Set<string>();
  if (!queueItem?.route?.root) return ids;
  ids.add(queueItem.route.root);
  queueItem.route.edges.forEach((edge) => {
    ids.add(edge.fromId);
    ids.add(edge.toId);
  });
  return ids;
}

export function getOutgoingEdges(queueItem: Pick<QueueConfig, "route"> | null | undefined, sourceId: string): RouteEdge[] {
  if (!queueItem || !sourceId) return [];
  return queueItem.route.edges.filter((edge) => edge.fromId === sourceId);
}

export function getMaxRouteStep(queues: Array<Pick<QueueConfig, "route">>): number {
  return Math.max(1, ...queues.flatMap((queueItem) => queueItem.route.edges.map((edge) => edge.step || 1)));
}

export function routeNodeCount(queueItem: Pick<QueueConfig, "route">): number {
  return getRouteNodeIds(queueItem).size;
}

export function countSplitPoints(queueItem: Pick<QueueConfig, "route">): number {
  if (!queueItem?.route?.root) return 0;
  return [...getRouteNodeIds(queueItem)].filter((nodeId) => getOutgoingEdges(queueItem, nodeId).length > 1).length;
}

export function getRouteTailIds(queueItem: Pick<QueueConfig, "route"> | null | undefined): string[] {
  if (!queueItem?.route?.root) return [];
  const nodes = getRouteNodeIds(queueItem);
  return [...nodes].filter((id) => getOutgoingEdges(queueItem, id).length === 0);
}

export function getActiveRouteSourceId(
  queueItem: Pick<QueueConfig, "route"> | null | undefined,
  state: Pick<AppState, "routeSourceId" | "selectedBuildingId">,
): string | null {
  if (!queueItem?.route?.root) return null;
  const nodeIds = getRouteNodeIds(queueItem);
  if (state.routeSourceId && nodeIds.has(state.routeSourceId)) return state.routeSourceId;
  if (state.selectedBuildingId && nodeIds.has(state.selectedBuildingId)) return state.selectedBuildingId;
  return getRouteTailIds(queueItem)[0] ?? queueItem.route.root;
}

export function canStartRouteLink(
  queueItem: QueueConfig | null | undefined,
  buildingId: string,
  state: Pick<AppState, "playing">,
): boolean {
  return Boolean(
    !state.playing &&
      queueItem?.route?.root &&
      getRouteNodeIds(queueItem).has(buildingId),
  );
}

export function canAppendRouteTarget(
  queueItem: QueueConfig | null | undefined,
  buildingId: string | null | undefined,
  sourceId: string | null | undefined,
  state: Pick<AppState, "playing">,
): boolean {
  if (!queueItem || !buildingId || state.playing) return false;
  if (!queueItem.route.root) return true;
  if (!sourceId || sourceId === buildingId) return false;
  if (!getRouteNodeIds(queueItem).has(sourceId)) return false;
  if (getOutgoingEdges(queueItem, sourceId).some((edge) => edge.toId === buildingId)) return false;
  return isLinkedBuildings(sourceId, buildingId);
}

export function addRouteEdge(
  queueItem: QueueConfig,
  fromId: string,
  toId: string,
  buildings: BuildingPoint[],
  options: Partial<Pick<RouteEdge, "step" | "pauseSeconds">> = {},
): boolean {
  if (!queueItem || !fromId || !toId) return false;
  if (!queueItem.route.root) queueItem.route.root = fromId;
  if (!canAppendRouteTarget(queueItem, toId, fromId, { playing: false })) return false;
  queueItem.route.edges.push({
    id: uid("edge"),
    fromId,
    toId,
    step: clamp(Math.floor(Number(options.step) || 1), 1, 999),
    pauseSeconds: clamp(Number(options.pauseSeconds) || 0, 0, 600),
  });
  pruneUnreachableRoute(queueItem, buildings);
  return true;
}

export function pruneUnreachableRoute(queueItem: QueueConfig, buildings: BuildingPoint[]): void {
  if (!queueItem?.route?.root) {
    queueItem.route.edges = [];
    return;
  }

  const buildingMap = buildingsById(buildings);
  if (!buildingMap.has(queueItem.route.root)) {
    queueItem.route = { root: null, edges: [] };
    return;
  }

  const reachable = new Set<string>([queueItem.route.root]);
  let changed = true;
  while (changed) {
    changed = false;
    queueItem.route.edges.forEach((edge) => {
      if (!reachable.has(edge.fromId) || !buildingMap.has(edge.toId) || reachable.has(edge.toId)) return;
      reachable.add(edge.toId);
      changed = true;
    });
  }

  queueItem.route.edges = queueItem.route.edges.filter(
    (edge) =>
      reachable.has(edge.fromId) &&
      reachable.has(edge.toId) &&
      buildingMap.has(edge.fromId) &&
      buildingMap.has(edge.toId),
  );
}

export function getRouteSelectBuildings(
  queueItem: QueueConfig | null | undefined,
  buildings: BuildingPoint[],
  sourceId: string | null | undefined,
  state: Pick<AppState, "playing">,
): BuildingPoint[] {
  if (!queueItem || !queueItem.route.root) return buildings;
  const ids = new Set(getLinkedBuildingIds(sourceId));
  return buildings.filter((item) => ids.has(item.id) && canAppendRouteTarget(queueItem, item.id, sourceId, state));
}

export function getRouteSourceBuildings(
  queueItem: QueueConfig | null | undefined,
  buildings: BuildingPoint[],
  state: Pick<AppState, "routeSourceId" | "selectedBuildingId" | "playing">,
): BuildingPoint[] {
  if (!queueItem?.route?.root) return [];
  const nodeIds = getRouteNodeIds(queueItem);
  return buildings.filter((item) => nodeIds.has(item.id) && getRouteSelectBuildings(queueItem, buildings, item.id, state).length > 0);
}

export function routeUsesForBuilding(buildingId: string, queues: QueueConfig[]): number {
  return queues.reduce((total, queueItem) => {
    if (!queueItem.route.root) return total;
    let count = queueItem.route.root === buildingId ? 1 : 0;
    queueItem.route.edges.forEach((edge) => {
      if (edge.fromId === buildingId) count += 1;
      if (edge.toId === buildingId) count += 1;
    });
    return total + count;
  }, 0);
}
