"use client";

import { useState, useEffect, useCallback, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";

const KiteSVG = dynamic(() => import("@/components/KiteSVG"), { ssr: false });

interface Palette {
  label: string;
  colorA: string;
  colorB: string;
  colorC: string;
}

const DEFAULTS = { colorA: "#FFFFFF", colorB: "#FFFFFF", colorC: "#FFFFFF" };

function KiteDesigner() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initA = searchParams.get("a") ?? DEFAULTS.colorA;
  const initB = searchParams.get("b") ?? DEFAULTS.colorB;
  const initC = searchParams.get("c") ?? DEFAULTS.colorC;

  const [colorA, setColorA] = useState(initA);
  const [colorB, setColorB] = useState(initB);
  const [colorC, setColorC] = useState(initC);
  const [designName, setDesignName] = useState("Loading...");
  const [preferences, setPreferences] = useState("");
  const [palettes, setPalettes] = useState<Palette[]>([]);
  const [loadingSuggest, setLoadingSuggest] = useState(false);
  const [copied, setCopied] = useState(false);

  const nameTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchName = useCallback(async (a: string, b: string, c: string) => {
    try {
      const res = await fetch("/api/name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ colorA: a, colorB: b, colorC: c }),
      });
      const data = await res.json();
      setDesignName(data.name ?? "Untitled Design");
    } catch {
      setDesignName("Untitled Design");
    }
  }, []);

  useEffect(() => {
    if (nameTimer.current) clearTimeout(nameTimer.current);
    nameTimer.current = setTimeout(() => fetchName(colorA, colorB, colorC), 800);
    return () => {
      if (nameTimer.current) clearTimeout(nameTimer.current);
    };
  }, [colorA, colorB, colorC, fetchName]);

  async function handleSuggest() {
    setLoadingSuggest(true);
    try {
      const res = await fetch("/api/suggest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ preferences }),
      });
      const data = await res.json();
      if (data.palettes) setPalettes(data.palettes);
    } catch {
      // silent fail
    } finally {
      setLoadingSuggest(false);
    }
  }

  function applyPalette(p: Palette) {
    setColorA(p.colorA);
    setColorB(p.colorB);
    setColorC(p.colorC);
  }

  function handleShare() {
    const url = `${window.location.origin}?a=${encodeURIComponent(colorA)}&b=${encodeURIComponent(colorB)}&c=${encodeURIComponent(colorC)}`;
    if (navigator.share) {
      navigator.share({ title: designName, text: `Check out my kite design: ${designName}`, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  }

  function handleReset() {
    setColorA(DEFAULTS.colorA);
    setColorB(DEFAULTS.colorB);
    setColorC(DEFAULTS.colorC);
    setPalettes([]);
    router.push("/");
  }

  return (
    <div
      className="min-h-screen p-6 md:p-10"
      style={{ background: "linear-gradient(180deg, #B8D9F0 0%, #E0F0FF 40%, #F5FAFF 100%)" }}
    >
      <div className="max-w-5xl mx-auto flex flex-col gap-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold" style={{ color: "#1A2E4A" }}>
            Kite Color Designer
          </h1>
          <p className="mt-1" style={{ color: "#4A7A9B" }}>
            Design your delta kite color scheme
          </p>
        </div>

        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Kite preview */}
          <div className="flex-1 flex flex-col items-center gap-4">
            <div
              className="w-full rounded-3xl p-6 flex flex-col items-center gap-4 shadow-md"
              style={{ backgroundColor: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}
            >
              <h2 className="text-xl font-semibold" style={{ color: "#1A2E4A" }}>
                {designName}
              </h2>
              <KiteSVG colorA={colorA} colorB={colorB} colorC={colorC} />
            </div>

            {/* Share & Reset */}
            <div className="flex gap-3 w-full">
              <button
                onClick={handleShare}
                className="flex-1 py-3 rounded-xl font-semibold transition-opacity hover:opacity-80"
                style={{ backgroundColor: "#4A9FD4", color: "white" }}
              >
                {copied ? "Copied! ✓" : "Share Design ↗"}
              </button>
              <button
                onClick={handleReset}
                className="px-5 py-3 rounded-xl font-semibold transition-opacity hover:opacity-80"
                style={{
                  backgroundColor: "rgba(255,255,255,0.7)",
                  color: "#4A7A9B",
                  border: "1px solid #B8D9F0",
                }}
              >
                Reset
              </button>
            </div>
          </div>

          {/* Controls */}
          <div className="w-full lg:w-80 flex flex-col gap-5">
            {/* Color pickers */}
            <div
              className="rounded-3xl p-6 flex flex-col gap-5 shadow-md"
              style={{ backgroundColor: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}
            >
              <h3 className="font-semibold text-lg" style={{ color: "#1A2E4A" }}>
                Band Colors
              </h3>
              {(
                [
                  ["Band A", colorA, setColorA],
                  ["Band B", colorB, setColorB],
                  ["Band C (border)", colorC, setColorC],
                ] as [string, string, (v: string) => void][]
              ).map(([label, value, setter]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium" style={{ color: "#2A4A6A" }}>
                    {label}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono" style={{ color: "#4A7A9B" }}>
                      {value.toUpperCase()}
                    </span>
                    <input
                      type="color"
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      className="w-10 h-10 rounded-lg cursor-pointer border-2"
                      style={{ borderColor: "#B8D9F0" }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* AI suggestions */}
            <div
              className="rounded-3xl p-6 flex flex-col gap-4 shadow-md"
              style={{ backgroundColor: "rgba(255,255,255,0.75)", backdropFilter: "blur(8px)" }}
            >
              <h3 className="font-semibold text-lg" style={{ color: "#1A2E4A" }}>
                AI Color Suggestions
              </h3>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="e.g. warm sunset tones, ocean blues, bold and contrasting..."
                rows={2}
                className="w-full rounded-xl px-4 py-3 text-sm resize-none outline-none"
                style={{
                  backgroundColor: "#EFF7FF",
                  color: "#1A2E4A",
                  border: "1px solid #B8D9F0",
                }}
              />
              <button
                onClick={handleSuggest}
                disabled={loadingSuggest}
                className="w-full py-3 rounded-xl font-semibold transition-opacity hover:opacity-80 disabled:opacity-50"
                style={{ backgroundColor: "#4A9FD4", color: "white" }}
              >
                {loadingSuggest ? "Generating..." : "Suggest Colors ✨"}
              </button>

              {palettes.length > 0 && (
                <div className="flex flex-col gap-3 mt-1">
                  {palettes.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => applyPalette(p)}
                      className="flex items-center gap-3 p-3 rounded-xl text-left transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: "#EFF7FF", border: "1px solid #B8D9F0" }}
                    >
                      <div className="flex gap-1">
                        {[p.colorA, p.colorB, p.colorC].map((c, j) => (
                          <div
                            key={j}
                            className="w-6 h-6 rounded-md"
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#1A2E4A" }}>
                        {p.label}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense>
      <KiteDesigner />
    </Suspense>
  );
}
