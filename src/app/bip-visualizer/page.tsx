import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import BipPipelineVisualizer from "@/components/visualizations/bip-pipeline/BipPipelineVisualizer";

export default function BipVisualizerPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="BIP Derivation Pipeline"
        description="BIP32/39/44/85 — Vom Mnemonic zum Wallet-Schlüssel, Schritt für Schritt"
        topic="bip-visualizer"
      >
        <BipPipelineVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
