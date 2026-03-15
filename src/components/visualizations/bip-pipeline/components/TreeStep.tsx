"use client";

import { useState, useCallback } from "react";
import type { MasterKey, TreeChild } from "../types";
import TreeTooltip, { type TooltipData } from "./TreeTooltip";
import TreeControls from "./TreeControls";
import TreeSvgCanvas from "./TreeSvgCanvas";
import TreeLegend from "./TreeLegend";
import ChildPipeline from "./ChildPipeline";

/* Re-use shared components from parent scope — imported inline to avoid
   circular deps. We duplicate the minimal ExplainBox + InfoCard here since
   they're private to BipPipelineVisualizer. */

function ExplainBox({
  icon,
  title,
  text,
  color = "var(--accent-secondary)",
  steps = [],
}: {
  icon: string;
  title: string;
  text: string;
  color?: string;
  steps?: string[];
}) {
  return (
    <div
      className="mb-8 flex items-start gap-5 rounded-[14px] border p-6"
      style={{
        borderColor: `color-mix(in srgb, ${color} 25%, transparent)`,
        background: `color-mix(in srgb, ${color} 6%, transparent)`,
      }}
    >
      <div className="flex-shrink-0 text-4xl leading-none">{icon}</div>
      <div className="flex-1">
        <div className="mb-2 font-body text-xl font-extrabold text-white">
          {title}
        </div>
        <div className="font-body text-[15px] leading-[1.8] text-text-secondary">
          {text}
        </div>
        {steps.length > 0 && (
          <div className="mt-3.5 flex flex-col gap-2">
            {steps.map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-white/5 bg-black/30 p-2.5"
              >
                <div
                  className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-full text-xs font-bold text-white"
                  style={{ background: color }}
                >
                  {i + 1}
                </div>
                <div
                  className="font-body text-sm leading-relaxed text-text-secondary [&_strong]:text-text-primary [&_code]:font-code [&_em]:text-accent-primary"
                  dangerouslySetInnerHTML={{ __html: s }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({
  children,
  variant = "cyan",
}: {
  children: React.ReactNode;
  variant?: "cyan" | "rose";
}) {
  return (
    <div
      className={`mt-4 rounded-xl border p-4 font-body text-sm leading-[1.8] text-text-secondary [&_strong]:text-accent-primary ${
        variant === "rose"
          ? "border-[#fb7185]/25 bg-[#fb7185]/5 [&_strong]:text-[#fb7185]"
          : "border-accent-primary/20 bg-accent-primary/5"
      }`}
    >
      {children}
    </div>
  );
}

interface TreeStepProps {
  masterKey: MasterKey | null;
  seed: Uint8Array | null;
  treeData: (TreeChild | null)[];
  treeLoading: boolean;
}

export default function TreeStep({
  masterKey,
  seed,
  treeData,
  treeLoading,
}: TreeStepProps) {
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showIsolation, setShowIsolation] = useState(true);
  const [showOneWay, setShowOneWay] = useState(true);
  const [highlightIdx, setHighlightIdx] = useState<number | null>(null);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (tooltip) setMousePos({ x: e.clientX + 14, y: e.clientY + 10 });
    },
    [tooltip]
  );

  const handleNodeHover = useCallback(
    (data: TooltipData | null, e?: React.MouseEvent) => {
      if (data && e) {
        setMousePos({ x: e.clientX + 14, y: e.clientY + 10 });
      }
      setTooltip(data);
    },
    []
  );

  return (
    <div onMouseMove={handleMouseMove}>
      <ExplainBox
        icon="🕸️"
        title="Der Ableitungsbaum — Überblick"
        text="Diese Visualisierung zeigt wie Master Seed, BIP85-Transformation und mehrere Kind-Seeds zusammenhängen — und warum der Weg nur in eine Richtung geht. Scrolle nach unten für die vollständige Child-Seed-Pipeline mit echten Daten."
        color="#38bdf8"
        steps={[
          "<strong>Master Seed (oben):</strong> Alles beginnt hier. Aus einem einzigen Master Key werden alle anderen Schlüssel deterministisch abgeleitet.",
          '<strong>HMAC-SHA512 Transformation (Mitte):</strong> Das ist der BIP85-Kern. Der Master-abgeleitete Private Key wird durch HMAC-SHA512 gejagt — Output: 64 Bytes neue Entropie.',
          "<strong>⛔ Einweg-Barriere:</strong> Die rote Linie zeigt die kryptografische Einwegfunktion. Kind-Seeds kennen können → Master <em>nie</em> rekonstruierbar.",
          "<strong>Kind-Seeds (unten, farbig):</strong> Vier unabhängige Kind-Seeds aus BIP85 Index 0–3. Jeder lebt in seiner eigenen Isolation-Zone. Hover über einen Knoten für Details.",
          "<strong>BIP44 Leaf-Keys:</strong> ext/0 = externe Adresse (change=0, index=0), berechnet. int/0 = interne Adresse (change=1) — symbolisch, nicht berechnet.",
          "<strong>⬇️ Child-Seed Pipeline (unten):</strong> Scrolle nach unten um die vollständige 5-Schritt-Pipeline pro Kind-Seed zu sehen.",
        ]}
      />

      <TreeControls
        showOneWay={showOneWay}
        setShowOneWay={setShowOneWay}
        showIsolation={showIsolation}
        setShowIsolation={setShowIsolation}
        treeLoading={treeLoading}
        childCount={treeData.filter(Boolean).length}
      />

      <TreeSvgCanvas
        masterKey={masterKey}
        seed={seed}
        treeData={treeData}
        treeLoading={treeLoading}
        highlightIdx={highlightIdx}
        showIsolation={showIsolation}
        showOneWay={showOneWay}
        onHighlight={setHighlightIdx}
        onNodeHover={handleNodeHover}
      />

      <TreeTooltip data={tooltip} position={mousePos} />

      <TreeLegend />

      <InfoCard>
        <strong>💡 Interaktion:</strong> Hover über einen Kind-Seed-Knoten um
        Details anzuzeigen und die zugehörige Ableitungslinie hervorzuheben. Die{" "}
        <span className="text-[#f472b6]">Einweg-Barriere</span> zeigt: Kenntnis
        eines Kind-Seeds erlaubt <strong>keinerlei Rückschluss</strong> auf den
        Master-Seed oder andere Kinder.
      </InfoCard>

      <ChildPipeline treeData={treeData} />
    </div>
  );
}
