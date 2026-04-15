import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import { AdressenVisualizer } from "@/components/visualizations/adressen/AdressenVisualizer";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Bitcoin Adressen" };

export default function AdressenPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Bitcoin Adressen"
        description="Wie aus einem Public Key eine Adresse wird — Base58Check und Bech32 Encoding"
        topic="adressen"
      >
        <AdressenVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
