import { buildingsById, getBuildingPoint, getRouteTailIds } from "./routeGraph";
import type {
  BuildingPoint,
  Point,
  QueueAccelCount,
  QueueConfig,
  QueueHistoryEntry,
  QueueRun,
  RouteEdge,
} from "./types";
import { clamp, uid } from "./utils";

export function ensureRuntimeSets(queueItem: QueueConfig): void {
  if (!(queueItem.runtime.startedEdgeIds instanceof Set)) {
    queueItem.runtime.startedEdgeIds = new Set(queueItem.runtime.startedEdgeIds || []);
  }
  if (!(queueItem.runtime.completedEdgeIds instanceof Set)) {
    queueItem.runtime.completedEdgeIds = new Set(queueItem.runtime.completedEdgeIds || []);
  }
}

export function createEligibleRuns(queueItem: QueueConfig, travelDuration: number, activeStep: number | null = null): QueueRun[] {
  ensureRuntimeSets(queueItem);
  return queueItem.route.edges
    .map((edge, index) => ({ edge, index }))
    .filter(({ edge, index }) => canStartRouteEdge(queueItem, edge, index, activeStep))
    .map(({ edge }) => {
      queueItem.runtime.startedEdgeIds.add(edge.id);
      return {
        id: uid("run"),
        edgeId: edge.id,
        fromId: edge.fromId,
        toId: edge.toId,
        step: edge.step,
        phase: "moving",
        elapsed: 0,
        segmentDuration: travelDuration,
        currentAccel: { twenty: 0, fifty: 0 },
      };
    });
}

export function canStartRouteEdge(
  queueItem: QueueConfig,
  edge: RouteEdge,
  edgeIndex: number,
  activeStep: number | null = null,
): boolean {
  const runtime = queueItem.runtime;
  if (activeStep !== null && edge.step !== activeStep) return false;
  if (runtime.startedEdgeIds.has(edge.id) || runtime.completedEdgeIds.has(edge.id)) return false;

  const earlierIncoming = queueItem.route.edges
    .map((candidate, index) => ({ edge: candidate, index }))
    .filter((item) => item.edge.toId === edge.fromId && item.index < edgeIndex);
  const sourceHasBeenReached =
    edge.fromId === queueItem.route.root || earlierIncoming.some((item) => runtime.completedEdgeIds.has(item.edge.id));

  return sourceHasBeenReached && earlierIncoming.every((item) => runtime.completedEdgeIds.has(item.edge.id));
}

export function advanceQueue(
  queueItem: QueueConfig,
  delta: number,
  travelDuration: number,
  buildings: BuildingPoint[],
  activeStep: number | null = null,
): void {
  ensureRuntimeSets(queueItem);
  const runtime = queueItem.runtime;
  if (runtime.status !== "running") return;
  if (!runtime.runs.length) {
    runtime.status = "finished";
    return;
  }

  const nextRuns: QueueRun[] = [];
  let maxOverrun = 0;
  runtime.runs.forEach((run) => {
    run.elapsed += delta;
    if (run.elapsed < run.segmentDuration) {
      nextRuns.push(run);
      return;
    }

    const overrun = run.elapsed - run.segmentDuration;
    if (run.phase === "moving") {
      recordSegment(queueItem, run, buildings);
      const edge = queueItem.route.edges.find((item) => item.id === run.edgeId);
      const pauseSeconds = Math.max(0, edge?.pauseSeconds || 0);
      if (pauseSeconds > 0) {
        const waitOverrun = overrun - pauseSeconds;
        run.phase = "waiting";
        run.elapsed = Math.min(overrun, pauseSeconds);
        run.segmentDuration = pauseSeconds;
        if (waitOverrun < 0) {
          nextRuns.push(run);
          return;
        }
        maxOverrun = Math.max(maxOverrun, waitOverrun);
      } else {
        maxOverrun = Math.max(maxOverrun, overrun);
      }
    } else {
      maxOverrun = Math.max(maxOverrun, overrun);
    }
    runtime.completedEdgeIds.add(run.edgeId);
  });

  runtime.runs = nextRuns;
  createEligibleRuns(queueItem, travelDuration, activeStep).forEach((run) => {
    run.elapsed = Math.min(maxOverrun, run.segmentDuration);
    runtime.runs.push(run);
  });
  if (!runtime.runs.length) runtime.status = "finished";
}

export function recordSegment(queueItem: QueueConfig, run: QueueRun, buildings: BuildingPoint[]): void {
  const buildingMap = buildingsById(buildings);
  queueItem.runtime.history.push({
    fromId: run.fromId,
    toId: run.toId,
    fromName: buildingMap.get(run.fromId)?.name || "未知",
    toName: buildingMap.get(run.toId)?.name || "未知",
    step: run.step,
    twenty: run.currentAccel.twenty,
    fifty: run.currentAccel.fifty,
  });
}

export function accelerateQueue(queueItem: QueueConfig, rate: 0.2 | 0.5): void {
  queueItem.runtime.runs.filter((run) => run.phase === "moving").forEach((run) => {
    const remaining = run.segmentDuration - run.elapsed;
    if (remaining <= 0.05) return;
    run.segmentDuration = run.elapsed + remaining * (1 - rate);
    if (rate === 0.2) run.currentAccel.twenty += 1;
    if (rate === 0.5) run.currentAccel.fifty += 1;
  });
}

export function isEdgeRunning(queueItem: QueueConfig, edge: RouteEdge): boolean {
  return Boolean(
    queueItem.runtime.status === "running" &&
      queueItem.runtime.runs.some((run) => run.edgeId === edge.id || (run.fromId === edge.fromId && run.toId === edge.toId)),
  );
}

export function getQueuePositions(queueItem: QueueConfig, buildings: BuildingPoint[]): Point[] {
  const buildingMap = buildingsById(buildings);
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
        const progress = run.phase === "waiting" ? 1 : clamp(run.elapsed / Math.max(run.segmentDuration, 0.01), 0, 1);
        return {
          x: fromPoint.x + (toPoint.x - fromPoint.x) * progress,
          y: fromPoint.y + (toPoint.y - fromPoint.y) * progress,
        };
      })
      .filter((point): point is Point => Boolean(point));
  }

  const completedEdges = queueItem.route.edges.filter((edge) => runtime.completedEdgeIds.has(edge.id));
  const completedFromIds = new Set(completedEdges.map((edge) => edge.fromId));
  const completedTailIds = completedEdges
    .map((edge) => edge.toId)
    .filter((id, index, ids) => !completedFromIds.has(id) && ids.indexOf(id) === index);
  const tails = getRouteTailIds(queueItem);
  const targetIds =
    runtime.status === "finished" && completedTailIds.length
      ? completedTailIds
      : runtime.status === "finished" && tails.length
        ? tails
        : [queueItem.route.root];
  return targetIds
    .map((targetId) => {
      const target = buildingMap.get(targetId);
      return target ? getBuildingPoint(target) : null;
    })
    .filter((point): point is Point => Boolean(point));
}

export function queueStatus(queueItem: QueueConfig, paused: boolean): string {
  if (paused && queueItem.runtime.status === "running") return "暂停";
  const statusMap: Record<string, string> = {
    idle: "待命",
    running: "行进",
    finished: "完成",
  };
  return statusMap[queueItem.runtime.status] || "待命";
}

export function remainingSeconds(queueItem: QueueConfig): number {
  if (queueItem.runtime.status !== "running") return 0;
  if (!queueItem.runtime.runs.length) return 0;
  return Math.min(...queueItem.runtime.runs.map((run) => Math.max(0, run.segmentDuration - run.elapsed)));
}

export function currentAcceleration(queueItem: QueueConfig): QueueAccelCount {
  return queueItem.runtime.runs.filter((run) => run.phase === "moving").reduce(
    (total, run) => {
      total.twenty += run.currentAccel.twenty;
      total.fifty += run.currentAccel.fifty;
      return total;
    },
    { twenty: 0, fifty: 0 },
  );
}

export function totalAcceleration(queueItem: QueueConfig): QueueAccelCount {
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

export function activeHistoryRows(queueItem: QueueConfig): Array<QueueHistoryEntry | (Omit<QueueHistoryEntry, "fromName" | "toName"> & { active: true })> {
  const rows: Array<QueueHistoryEntry | (Omit<QueueHistoryEntry, "fromName" | "toName"> & { active: true })> = [
    ...queueItem.runtime.history,
  ];
  if (queueItem.runtime.status === "running") {
    queueItem.runtime.runs.forEach((run) => {
      if (run.phase === "waiting") return;
      rows.push({
        fromId: run.fromId,
        toId: run.toId,
        step: run.step,
        twenty: run.currentAccel.twenty,
        fifty: run.currentAccel.fifty,
        active: true,
      });
    });
  }
  return rows;
}
