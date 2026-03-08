"use client";

import { useMemo } from "react";
import { buildKitePanels, KITE_OUTLINE } from "@/lib/kiteGeometry";

interface KiteSVGProps {
  colorA: string;
  colorB: string;
  colorC: string;
}

export default function KiteSVG({ colorA, colorB, colorC }: KiteSVGProps) {
  const panels = useMemo(() => buildKitePanels(), []);

  const fillFor = (type: string) => {
    if (type === "A") return colorA;
    if (type === "B") return colorB;
    return colorC;
  };

  return (
    <svg
      viewBox="0 0 500 600"
      xmlns="http://www.w3.org/2000/svg"
      className="w-full h-full"
      style={{ maxHeight: "520px" }}
    >
      {/* White kite base */}
      <polygon
        points={KITE_OUTLINE}
        fill="#ffffff"
        stroke="#1A1A1A"
        strokeWidth="5"
        strokeLinejoin="round"
      />

      {/* Ribbon panels — white when empty, colored when user picks.
          Each cell has 3 trapezoid ribbons along its edges.
          The white center gap and white background show through between ribbons. */}
      {panels.map((panel, i) => (
        <polygon
          key={i}
          points={panel.points}
          fill={fillFor(panel.type)}
          stroke="#1A1A1A"
          strokeWidth="2"
          strokeLinejoin="round"
        />
      ))}
    </svg>
  );
}
