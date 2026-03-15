import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import Bip39SeedVisualizer from "@/components/visualizations/bip39/Bip39SeedVisualizer";

export default function Bip39Page() {
  return (
    <PageShell>
      <VisualizationShell
        title="Wie entsteht eine Seed Phrase?"
        description="Der Weg vom Zufallswert zu den 12 oder 24 Wörtern deines Wallets"
        topic="bip39"
      >
        <Bip39SeedVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
