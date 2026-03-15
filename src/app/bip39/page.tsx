import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import Bip39SeedVisualizer from "@/components/visualizations/bip39/Bip39SeedVisualizer";

export default function Bip39Page() {
  return (
    <PageShell>
      <VisualizationShell
        title="BIP-39 Seed Generation"
        description="Interaktive Visualisierung der Seed-Phrase-Erzeugung — 12 vs 24 Wörter im Vergleich"
        topic="bip39"
      >
        <Bip39SeedVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
