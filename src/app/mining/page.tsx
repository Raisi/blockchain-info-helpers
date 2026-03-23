import { PageShell } from "@/components/layout";
import { VisualizationShell } from "@/components/visualizations/VisualizationShell";
import MiningVisualizer from "@/components/visualizations/mining/MiningVisualizer";

export default function MiningPage() {
  return (
    <PageShell>
      <VisualizationShell
        title="Mining Simulator"
        description="Nonce finden, Difficulty verstehen — wie neue Bitcoin-Blöcke entstehen"
        topic="mining"
      >
        <MiningVisualizer />
      </VisualizationShell>
    </PageShell>
  );
}
