export type PanelType = "A" | "B" | "C";

export interface Panel {
  points: string; // SVG points attribute
  type: PanelType;
}

type Point = [number, number];

function lerp(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

// Find where line a1→a2 intersects line b1→b2
function lineIntersect(a1: Point, a2: Point, b1: Point, b2: Point): Point {
  const dx1 = a2[0] - a1[0], dy1 = a2[1] - a1[1];
  const dx2 = b2[0] - b1[0], dy2 = b2[1] - b1[1];
  const denom = dx1 * dy2 - dy1 * dx2;
  const t = ((b1[0] - a1[0]) * dy2 - (b1[1] - a1[1]) * dx2) / denom;
  return [a1[0] + t * dx1, a1[1] + t * dy1];
}

function toSvgPoints(pts: Point[]): string {
  return pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
}

export function buildKitePanels(): Panel[] {
  const T: Point = [250, 20];
  const BL: Point = [20, 580];
  const BR: Point = [480, 580];

  const P = (row: number, col: number): Point => {
    if (row === 0) return T;
    const left = lerp(T, BL, row / 4);
    const right = lerp(T, BR, row / 4);
    return lerp(left, right, col / row);
  };

  const panels: Panel[] = [];
  const RW = 0.28; // ribbon width fraction from edge toward opposite vertex

  const addCell = (v0: Point, v1: Point, v2: Point, isUpward: boolean) => {
    const G: Point = [
      (v0[0] + v1[0] + v2[0]) / 3,
      (v0[1] + v1[1] + v2[1]) / 3,
    ];

    // Build a ribbon along edge e1→e2 (with vOpp as the opposite vertex).
    // The inner edge is parallel to e1-e2 at fraction RW toward vOpp.
    // The inner *corners* are clipped to the centroid-direction lines from e1 and e2,
    // so the three ribbons in a cell share clean junction points — no overlap,
    // and a small white triangular gap appears at the center.
    const makeRibbon = (e1: Point, e2: Point, vOpp: Point): Point[] => {
      const inner1 = lerp(e1, vOpp, RW);
      const inner2 = lerp(e2, vOpp, RW);
      // Clip inner corners to the lines from e1→G and e2→G
      const c1 = lineIntersect(e1, G, inner1, inner2);
      const c2 = lineIntersect(e2, G, inner1, inner2);
      return [e1, e2, c2, c1];
    };

    // Upward (V0=apex, V1=bottom-left, V2=bottom-right):
    //   A = left-diagonal ribbon along V0→V1, toward V2
    //   B = right-diagonal ribbon along V0→V2, toward V1
    //   C = horizontal ribbon along V1→V2, toward V0
    //
    // Downward (V0=top-left, V1=top-right, V2=bottom):
    //   A = left-diagonal ribbon along V0→V2, toward V1
    //   B = right-diagonal ribbon along V1→V2, toward V0
    //   C = horizontal ribbon along V0→V1, toward V2
    const ribbons: [Point[], PanelType][] = isUpward
      ? [
          [makeRibbon(v0, v1, v2), "A"],
          [makeRibbon(v0, v2, v1), "B"],
          [makeRibbon(v1, v2, v0), "C"],
        ]
      : [
          [makeRibbon(v0, v2, v1), "A"],
          [makeRibbon(v1, v2, v0), "B"],
          [makeRibbon(v0, v1, v2), "C"],
        ];

    for (const [pts, type] of ribbons) {
      panels.push({ points: toSvgPoints(pts), type });
    }
  };

  // 10 upward triangles
  for (let r = 0; r <= 3; r++) {
    for (let j = 0; j <= r; j++) {
      addCell(P(r, j), P(r + 1, j), P(r + 1, j + 1), true);
    }
  }

  // 6 downward triangles
  for (let r = 1; r <= 3; r++) {
    for (let j = 0; j < r; j++) {
      addCell(P(r, j), P(r, j + 1), P(r + 1, j + 1), false);
    }
  }

  return panels;
}

export const KITE_OUTLINE = "250,20 20,580 480,580";
