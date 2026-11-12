import { getSmoothStepPath, Position } from "@xyflow/react";
import { CANVAS_GRID_SIZE, snapCanvasCoordinate as snap } from "./canvas-grid";
import { END_ARROW_CLEARANCE } from "./element-connection-config";

type Point = Readonly<{ x: number; y: number }>;
const grid = CANVAS_GRID_SIZE;
const coordinates = ({ x, y }: Point) => `${x} ${y}`;

/** SVG commands after the first point of an orthogonal route. */
function roundedSegments(points: readonly Point[], radius: number) {
  let commands = "";
  for (let index = 1; index < points.length - 1; index++) {
    const previous = points[index - 1];
    const corner = points[index];
    const next = points[index + 1];
    const incomingX = previous.x - corner.x;
    const incomingY = previous.y - corner.y;
    const outgoingX = next.x - corner.x;
    const outgoingY = next.y - corner.y;
    const bend = Math.min(
      radius,
      (Math.abs(incomingX) + Math.abs(incomingY)) / 2,
      (Math.abs(outgoingX) + Math.abs(outgoingY)) / 2
    );
    if (!bend || (!incomingX && !outgoingX) || (!incomingY && !outgoingY)) {
      commands += ` L ${coordinates(corner)}`;
      continue;
    }
    const enter = {
      x: corner.x + Math.sign(incomingX) * bend,
      y: corner.y + Math.sign(incomingY) * bend,
    };
    const leave = {
      x: corner.x + Math.sign(outgoingX) * bend,
      y: corner.y + Math.sign(outgoingY) * bend,
    };
    commands += ` L ${coordinates(enter)} Q ${coordinates(corner)} ${coordinates(leave)}`;
  }
  return `${commands} L ${coordinates(points[points.length - 1])}`;
}

/** Join a handle to its grid row while keeping horizontal tangents at both ends. */
function joinRow(from: Point, to: Point) {
  if (from.y === to.y) return ` L ${coordinates(to)}`;
  const middle = (from.x + to.x) / 2;
  return ` C ${middle} ${from.y} ${middle} ${to.y} ${coordinates(to)}`;
}

export function getGridConnectionPath(
  options: Readonly<Parameters<typeof getSmoothStepPath>[0]>
): readonly [path: string, labelX: number, labelY: number] {
  const { sourceX, sourceY, targetX, targetY, borderRadius = 20 } = options;
  const source = { x: sourceX, y: sourceY };
  const target = { x: targetX, y: targetY };
  const approach = { x: targetX - END_ARROW_CLEARANCE, y: targetY };
  const middleX = (sourceX + targetX) / 2;
  const sourceRow = snap(sourceY);
  const targetRow = snap(targetY);
  const spineX = snap(middleX);
  if (
    options.sourcePosition !== Position.Right ||
    options.targetPosition !== Position.Left
  ) {
    const [path, labelX, labelY] = getSmoothStepPath({
      ...options,
      offset: Math.max(options.offset ?? 20, 2 * END_ARROW_CLEARANCE),
    });
    return [path, labelX, labelY];
  }

  const room = Math.min(spineX - sourceX, approach.x - spineX);
  if (room > 0 || (sourceRow === targetRow && sourceX < approach.x)) {
    const lead = Math.min(
      grid,
      sourceRow === targetRow ? (approach.x - sourceX) / 4 : room / 2
    );
    const start = { x: sourceX + lead, y: sourceRow };
    const end = { x: approach.x - lead, y: targetRow };
    const rails =
      sourceRow === targetRow
        ? [start, end]
        : [
            start,
            { x: spineX, y: sourceRow },
            { x: spineX, y: targetRow },
            end,
          ];
    const path = `M ${coordinates(source)}${joinRow(source, start)}${roundedSegments(rails, borderRadius)}${joinRow(end, approach)} L ${coordinates(target)}`;
    return [
      path,
      sourceRow === targetRow ? middleX : spineX,
      (sourceRow + targetRow) / 2,
    ];
  }

  // Cards close together or facing away from each other need a grid row
  // between the outer lead-ins.
  const exitX = Math.ceil((sourceX + grid / 2) / grid) * grid;
  const entryX = Math.floor((targetX - 2 * END_ARROW_CLEARANCE) / grid) * grid;
  const bridgeY =
    Math.abs(sourceRow - targetRow) > grid
      ? snap((sourceRow + targetRow) / 2)
      : Math.min(sourceRow, targetRow) - 2 * grid;
  const detour = [
    source,
    { x: exitX, y: sourceY },
    { x: exitX, y: bridgeY },
    { x: entryX, y: bridgeY },
    { x: entryX, y: targetY },
    target,
  ];
  return [
    `M ${coordinates(source)}${roundedSegments(detour, borderRadius)}`,
    (exitX + entryX) / 2,
    bridgeY,
  ];
}
