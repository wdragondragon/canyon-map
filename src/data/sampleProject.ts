import { DEFAULT_BUILDINGS } from "./defaultMap";
import type { ProjectDraft, QueueDraft } from "../types";

function queue(
  id: string,
  name: string,
  color: string,
  fontSize: number,
  markerSize: number,
  route: string[],
): QueueDraft {
  return { id, name, color, fontSize, markerSize, route };
}

export function createSampleProject(): ProjectDraft {
  return {
    travelDuration: 8,
    selectedBuildingId: "s1",
    selectedQueueId: "q-red",
    buildings: DEFAULT_BUILDINGS.map((item) => ({ ...item })),
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
