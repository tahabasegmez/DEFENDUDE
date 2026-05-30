import type { WorldPoint } from "../../../core/grid/GridCoordinate";
import type { TrialCollisionBody, TrialCollisionRect } from "./TrialCollisionTypes";

const collisionSeparationPixels = 0.5;

export function moveCircleWithBlockers(
  _current: WorldPoint,
  desired: WorldPoint,
  mover: TrialCollisionBody,
  blockers: readonly TrialCollisionBody[]
): WorldPoint {
  let resolved = { ...desired };

  for (let pass = 0; pass < 3; pass++) {
    let changed = false;

    for (const blocker of blockers) {
      if (!blocker.isBlocking() || blocker.id === mover.id) {
        continue;
      }

      const moverRect = getCollisionRectAt(resolved, mover);
      const blockerRect = getCollisionRect(blocker);
      if (!rectsOverlap(moverRect, blockerRect)) {
        continue;
      }

      const pushLeft = moverRect.right - blockerRect.left;
      const pushRight = blockerRect.right - moverRect.left;
      const pushUp = moverRect.bottom - blockerRect.top;
      const pushDown = blockerRect.bottom - moverRect.top;
      const minimumPush = Math.min(pushLeft, pushRight, pushUp, pushDown);

      if (minimumPush === pushLeft) {
        resolved.x -= pushLeft + collisionSeparationPixels;
      }
      else if (minimumPush === pushRight) {
        resolved.x += pushRight + collisionSeparationPixels;
      }
      else if (minimumPush === pushUp) {
        resolved.y -= pushUp + collisionSeparationPixels;
      }
      else {
        resolved.y += pushDown + collisionSeparationPixels;
      }

      changed = true;
    }

    if (!changed) {
      break;
    }
  }

  return resolved;
}

export function canOccupyCircle(
  point: WorldPoint,
  mover: TrialCollisionBody,
  blockers: readonly TrialCollisionBody[]
): boolean {
  const moverRect = getCollisionRectAt(point, mover);

  return blockers.every((blocker) => {
    if (!blocker.isBlocking() || blocker.id === mover.id) {
      return true;
    }

    return !rectsOverlap(moverRect, getCollisionRect(blocker));
  });
}

export function getCollisionRect(body: TrialCollisionBody): TrialCollisionRect {
  return getCollisionRectAt({ x: body.x, y: body.y }, body);
}

export function getCollisionRectAt(point: WorldPoint, body: TrialCollisionBody): TrialCollisionRect {
  const extents = body.collisionExtentsPixels ?? {
    left: body.radiusPixels,
    right: body.radiusPixels,
    top: body.radiusPixels,
    bottom: body.radiusPixels
  };
  const margins = body.collisionMarginsPixels ?? {
    left: body.marginPixels,
    right: body.marginPixels,
    top: body.marginPixels,
    bottom: body.marginPixels
  };

  return {
    left: point.x - extents.left - margins.left,
    right: point.x + extents.right + margins.right,
    top: point.y - extents.top - margins.top,
    bottom: point.y + extents.bottom + margins.bottom
  };
}

export function rectsOverlap(a: TrialCollisionRect, b: TrialCollisionRect): boolean {
  return a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
}

export function segmentIntersectsRect(
  start: WorldPoint,
  end: WorldPoint,
  rect: TrialCollisionRect
): boolean {
  if (pointInRect(start, rect) || pointInRect(end, rect)) {
    return true;
  }

  const corners = [
    { x: rect.left, y: rect.top },
    { x: rect.right, y: rect.top },
    { x: rect.right, y: rect.bottom },
    { x: rect.left, y: rect.bottom }
  ];

  for (let index = 0; index < corners.length; index++) {
    const nextIndex = (index + 1) % corners.length;
    if (segmentsIntersect(start, end, corners[index], corners[nextIndex])) {
      return true;
    }
  }

  return false;
}

function pointInRect(point: WorldPoint, rect: TrialCollisionRect): boolean {
  return point.x >= rect.left && point.x <= rect.right && point.y >= rect.top && point.y <= rect.bottom;
}

function segmentsIntersect(a: WorldPoint, b: WorldPoint, c: WorldPoint, d: WorldPoint): boolean {
  const directionA = direction(c, d, a);
  const directionB = direction(c, d, b);
  const directionC = direction(a, b, c);
  const directionD = direction(a, b, d);

  return directionA * directionB < 0 && directionC * directionD < 0;
}

function direction(a: WorldPoint, b: WorldPoint, c: WorldPoint): number {
  return (c.x - a.x) * (b.y - a.y) - (b.x - a.x) * (c.y - a.y);
}
