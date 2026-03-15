import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import BipPipelineVisualizer from "@/components/visualizations/bip-pipeline/BipPipelineVisualizer";

export default function BipVisualizerPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Vom Seed zum Wallet"
        description="Wie aus einer Seed Phrase alle Schlüssel und Adressen abgeleitet werden (BIP-32/44)"
        topic="bip-visualizer"
      >
        <BipPipelineVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
